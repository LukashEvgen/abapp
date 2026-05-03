import functions from '@react-native-firebase/functions';
import {Alert} from 'react-native';
import {Linking} from 'react-native';

export type PaymentGateway = 'liqpay' | 'wayforpay';

export async function payInvoice(
  clientId: string,
  invoiceId: string,
  amount: number,
  description: string,
  gateway: PaymentGateway,
): Promise<{checkoutUrl: string; orderId: string} | null> {
  try {
    if (gateway === 'liqpay') {
      const result = await functions().httpsCallable('createLiqPayCheckout')({
        clientId,
        invoiceId,
        amount,
        description,
      });
      const {checkoutUrl, orderId} = result.data || {};
      if (!checkoutUrl) {
        throw new Error('Не вдалося створити платіж LiqPay');
      }
      return {checkoutUrl, orderId};
    }
    if (gateway === 'wayforpay') {
      const result = await functions().httpsCallable('createWayForPayCheckout')({
        clientId,
        invoiceId,
        amount,
        description,
      });
      const {checkoutUrl, orderId} = result.data || {};
      if (!checkoutUrl) {
        throw new Error('Не вдалося створити платіж WayForPay');
      }
      return {checkoutUrl, orderId};
    }
  } catch (error: any) {
    const msg = error?.message || 'Помилка платіжного шлюзу';
    Alert.alert('Помилка оплати', msg);
    throw error;
  }
  return null;
}

export async function openPaymentUrl(checkoutUrl: string) {
  const canOpen = await Linking.canOpenURL(checkoutUrl);
  if (canOpen) {
    await Linking.openURL(checkoutUrl);
  } else {
    Alert.alert('Помилка', 'Не вдалося відкрити сторінку оплати');
  }
}
