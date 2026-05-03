import React, {useState} from 'react';
import {View, Text, Image, StyleSheet, Alert} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../../context/AuthContext';
import {uploadDocument} from '../../services/documents';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
} from '../../utils/theme';
import {
  GoldButton,
  ProgressBar,
  Card,
} from '../../components/shared/UIComponents';

export default function ScannerScreen({route, navigation}) {
  const {caseId} = route.params;
  const {user} = useAuth();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const pickCamera = () => {
    launchCamera(
      {mediaType: 'photo', quality: 0.9, includeBase64: false},
      res => {
        if (res.didCancel || res.errorCode) {
          return;
        }
        const asset = res.assets?.[0];
        if (asset) {
          setFile({
            name: asset.fileName || 'photo.jpg',
            uri: asset.uri,
            type: asset.type,
            size: asset.fileSize,
          });
        }
        setStep(2);
      },
    );
  };

  const pickGallery = () => {
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.9, includeBase64: false},
      res => {
        if (res.didCancel || res.errorCode) {
          return;
        }
        const asset = res.assets?.[0];
        if (asset) {
          setFile({
            name: asset.fileName || 'image.jpg',
            uri: asset.uri,
            type: asset.type,
            size: asset.fileSize,
          });
        }
        setStep(2);
      },
    );
  };

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });
      setFile({name: res.name, uri: res.uri, type: res.type, size: res.size});
      setStep(2);
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) {
        Alert.alert('Помилка', e.message);
      }
    }
  };

  const startUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStep(3);
    try {
      const {id, url} = await uploadDocument(
        user.uid,
        caseId,
        file.uri,
        file.name,
        file.size || 0,
        file.type || '',
        '', // sha256 not calculated client-side yet
        setProgress,
      );
      setStep(4);
    } catch (e) {
      Alert.alert('Помилка завантаження', e.message);
      setUploading(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={styles.header}>PDF-сканер · Крок {step}/4</Text>

        {step === 1 && (
          <>
            <Text style={styles.subtitle}>Оберіть джерело</Text>
            <GoldButton
              title="📷 Камера"
              onPress={pickCamera}
              style={{marginBottom: spacing.md}}
            />
            <GoldButton
              title="🖼 Галерея"
              onPress={pickGallery}
              variant="ghost"
              style={{marginBottom: spacing.md}}
            />
            <GoldButton
              title="📁 Файл"
              onPress={pickDocument}
              variant="ghost"
            />
          </>
        )}

        {step === 2 && file && (
          <>
            <Card>
              <Text style={styles.label}>Назва</Text>
              <Text style={styles.value}>{file.name}</Text>
              <Text style={styles.label}>Тип</Text>
              <Text style={styles.value}>{file.type || '—'}</Text>
              <Text style={styles.label}>Розмір</Text>
              <Text style={styles.value}>
                {file.size ? (file.size / 1024).toFixed(1) + ' KB' : '—'}
              </Text>
            </Card>
            {file.uri && file.type?.startsWith('image') && (
              <Image
                source={{uri: file.uri}}
                style={styles.preview}
                resizeMode="contain"
              />
            )}
            <View style={styles.row}>
              <GoldButton
                title="Повторити"
                variant="ghost"
                onPress={() => setStep(1)}
              />
              <View style={{width: spacing.md}} />
              <GoldButton title="Завантажити" onPress={startUpload} />
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.subtitle}>Завантаження...</Text>
            <ProgressBar progress={progress} />
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.subtitle}>✅ Успішно завантажено</Text>
            <Card>
              <Text style={styles.value}>{file?.name}</Text>
              <Text style={styles.label}>Справу зашифровано (AES-256)</Text>
            </Card>
            <GoldButton title="Готово" onPress={() => navigation.goBack()} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  subtitle: {
    color: colors.muted,
    fontSize: tokens.typography.size.md,
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.sm,
  },
  value: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  progressText: {
    color: colors.gold,
    fontSize: tokens.typography.size.base,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
