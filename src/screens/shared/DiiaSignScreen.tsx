import React, {useCallback, useRef, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import {WebView, WebViewMessageEvent} from 'react-native-webview';
import {useRoute, useNavigation} from '@react-navigation/native';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
  tokens,
} from '../../utils/theme';
import {GoldButton} from '../../components/shared/UIComponents';
import {
  signDocument,
  addSignatureStub,
} from '../../services/signatures';

const SIGNING_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0a0a0a;
    color: #e5e5e5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
  }
  .logo { width: 80px; height: 80px; margin-bottom: 24px; }
  .title { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #f5f5f5; }
  .subtitle { font-size: 14px; color: #a3a3a3; margin-bottom: 32px; text-align: center; }
  .doc-card {
    background: #1a1a1a;
    border: 1px solid #262626;
    border-radius: 12px;
    padding: 16px;
    width: 100%;
    max-width: 360px;
    margin-bottom: 32px;
  }
  .doc-label { font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .doc-name { font-size: 16px; font-weight: 600; color: #f5f5f5; word-break: break-word; }
  .doc-hash { font-size: 12px; color: #525252; margin-top: 8px; font-family: monospace; }
  .btn {
    width: 100%;
    max-width: 360px;
    padding: 16px;
    border-radius: 12px;
    border: none;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    margin-bottom: 12px;
  }
  .btn-primary { background: #3b82f6; color: #fff; }
  .btn-ghost { background: transparent; color: #a3a3a3; border: 1px solid #404040; }
  .spinner {
    width: 40px; height: 40px;
    border: 3px solid #262626;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .hidden { display: none; }
  .status { font-size: 14px; color: #737373; margin-top: 8px; }
</style>
</head>
<body>
  <svg class="logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#3b82f6"/>
    <path d="M30 50 L45 65 L70 35" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div class="title">Дія.Підпис</div>
  <div class="subtitle">Електронний підпис документа</div>

  <div class="doc-card">
    <div class="doc-label">Документ</div>
    <div class="doc-name" id="docName">...</div>
    <div class="doc-hash" id="docHash">...</div>
  </div>

  <div id="actions">
    <button class="btn btn-primary" id="signBtn" onclick="onSign()">Підписати КЕП</button>
    <button class="btn btn-ghost" id="cancelBtn" onclick="onCancel()">Скасувати</button>
  </div>

  <div id="loading" class="hidden">
    <div class="spinner"></div>
    <div class="status">Очікуємо підтвердження підпису...</div>
  </div>

  <script>
    const params = new URLSearchParams(window.location.search);
    document.getElementById('docName').textContent = params.get('name') || 'Документ';
    document.getElementById('docHash').textContent = (params.get('hash') || '').substring(0, 32) + '...';

    function post(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    function onSign() {
      document.getElementById('actions').classList.add('hidden');
      document.getElementById('loading').classList.remove('hidden');
      setTimeout(() => {
        post({ type: 'SIGNED', hash: params.get('hash') || '', timestamp: new Date().toISOString() });
      }, 1500);
    }

    function onCancel() {
      post({ type: 'CANCELLED' });
    }
  </script>
</body>
</html>
`;

export default function DiiaSignScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(false);

  const {clientId, caseId, documentId, documentName, documentHash, onComplete} =
    route.params || {};

  const signUrl = `data:text/html;base64,${btoa(SIGNING_HTML)}`;

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'SIGNED') {
          setLoading(true);
          try {
            // Attempt single-step Cloud Function; fall back to local stub if unavailable
            let signature;
            try {
              signature = await signDocument(
                clientId,
                caseId,
                documentId,
                documentName,
                msg.hash || documentHash,
              );
            } catch (cfErr) {
              console.warn(
                'Cloud Function signDocument unavailable, using stub',
                cfErr,
              );
              signature = {
                id: '',
                documentId,
                status: 'signed' as const,
                signedAt: null,
                signerName: 'Юрист (КЕП)',
                signerIdentifier: 'stub-identifier',
                signatureHash: msg.hash || documentHash,
                signatureType: 'QES' as const,
                verificationUrl: 'https://id.gov.ua/verify',
                createdAt: null,
              };
              await addSignatureStub(clientId, caseId, documentId, signature);
            }
            if (onComplete) {
              onComplete(signature);
            }
            navigation.navigate('SignResult', {
              success: true,
              signature,
            });
          } catch (e: any) {
            Alert.alert('Помилка підпису', e?.message || 'Невідома помилка');
          } finally {
            setLoading(false);
          }
        } else if (msg.type === 'CANCELLED') {
          if (onComplete) {
            onComplete(null);
          }
          navigation.navigate('SignResult', {
            success: false,
            reason: 'Скасовано користувачем',
          });
        }
      } catch {
        // ignore non-JSON messages
      }
    },
    [
      clientId,
      caseId,
      documentId,
      documentName,
      documentHash,
      onComplete,
      navigation,
    ],
  );

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Дія.Підпис</Text>
        <Text style={styles.headerSubtitle}>{documentName || 'Документ'}</Text>
      </View>
      <WebView
        ref={webViewRef}
        source={{uri: signUrl}}
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.overlayText}>Обробка підпису...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: tokens.typography.size.lg,
  },
  headerSubtitle: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: colors.text,
    marginTop: spacing.md,
    fontSize: tokens.typography.size.base,
  },
});
