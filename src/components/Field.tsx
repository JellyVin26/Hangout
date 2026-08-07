import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { radii, space } from '@/theme/tokens';
import { usePalette } from '@/store/useApp';
import { Ty } from './Text';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

/** Label above input, helper below, error below that. Never placeholder-as-label. */
export function Field({ label, error, hint, children }: FieldProps) {
  const p = usePalette();
  return (
    <View style={{ gap: 6, marginBottom: space.lg }}>
      <Ty variant="bodySmall" style={{ fontWeight: '600' }}>
        {label}
      </Ty>
      {children}
      {hint && !error ? (
        <Ty variant="caption" faint>
          {hint}
        </Ty>
      ) : null}
      {error ? (
        <Ty variant="caption" color={p.danger}>
          {error}
        </Ty>
      ) : null}
    </View>
  );
}

interface InputProps extends TextInputProps {
  error?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input({ error, style, ...rest }, ref) {
  const p = usePalette();
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={p.inkFaint}
      selectionColor={p.accent}
      style={[
        {
          height: 52,
          borderRadius: radii.input,
          borderWidth: 1,
          borderColor: error ? p.danger : p.line,
          backgroundColor: p.surface,
          paddingHorizontal: space.lg,
          color: p.ink,
          fontFamily: 'Sora_500Medium',
          fontSize: 15,
        },
        style,
      ]}
      {...rest}
    />
  );
});

export const TextArea = forwardRef<TextInput, InputProps>(function TextArea({ error, style, ...rest }, ref) {
  const p = usePalette();
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={p.inkFaint}
      selectionColor={p.accent}
      multiline
      style={[
        {
          minHeight: 96,
          borderRadius: radii.input,
          borderWidth: 1,
          borderColor: error ? p.danger : p.line,
          backgroundColor: p.surface,
          paddingHorizontal: space.lg,
          paddingTop: space.md,
          color: p.ink,
          fontFamily: 'Sora_400Regular',
          fontSize: 15,
          textAlignVertical: 'top',
        },
        style,
      ]}
      {...rest}
    />
  );
});

export const styles2 = StyleSheet.create({});
