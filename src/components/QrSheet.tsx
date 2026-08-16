import { Modal, Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';

import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { Button } from '@/components/Button';
import { Ty } from '@/components/Text';
import { toast } from '@/components/Toast';

export function QrSheet({
  value,
  title,
  subtitle,
  visible,
  onClose,
}: {
  value: string;
  title: string;
  subtitle?: string;
  visible: boolean;
  onClose: () => void;
}) {
  const p = usePalette();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: space.xl,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: p.surface,
            borderRadius: radii.xl,
            padding: space.xl,
            alignItems: 'center',
            maxWidth: 340,
            width: '100%',
          }}
        >
          <Ty variant="title2" style={{ marginBottom: 4 }}>{title}</Ty>
          {subtitle ? (
            <Ty variant="bodySmall" muted center style={{ marginBottom: space.lg }}>{subtitle}</Ty>
          ) : null}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: radii.card, padding: 16, marginBottom: space.lg }}>
            <QRCode value={value} size={190} backgroundColor="#FFFFFF" color="#16120F" />
          </View>
          <Ty variant="caption" faint center style={{ marginBottom: space.lg }}>
            {value}
          </Ty>
          <Button
            label="Copy link"
            icon="ClipboardText"
            fullWidth
            onPress={async () => {
              await Clipboard.setStringAsync(value);
              toast('Link copied', 'success');
              onClose();
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}