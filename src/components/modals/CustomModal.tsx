import React, { ForwardedRef, ReactNode, forwardRef, useMemo } from 'react';

import CustomBottomSheet, {
  BottomSheetHandle,
  CustomBottomSheetProps,
} from '@/components/modals/BottomSheet';

type ModalVariant = 'auto' | 'form' | 'picker';

type AllowedProps = Omit<CustomBottomSheetProps, 'snapPoints' | 'enableDynamicSizing'> & {
  children: ReactNode;
  variant?: ModalVariant;
  fallbackSnapPoint?: string | number;
  enableDynamicSizing?: boolean;
};

const DEFAULT_VARIANT_SNAP_POINTS: Record<ModalVariant, (string | number)[] | undefined> = {
  auto: undefined,
  form: ['60%'],
  picker: ['40%'],
};

function CustomModalComponent(
  {
    children,
    variant = 'auto',
    fallbackSnapPoint,
    enableDynamicSizing,
    ...rest
  }: AllowedProps,
  ref: ForwardedRef<BottomSheetHandle>
) {
  const resolvedSnapPoints = useMemo<(string | number)[] | undefined>(() => {
    const base = fallbackSnapPoint ? [fallbackSnapPoint] : DEFAULT_VARIANT_SNAP_POINTS[variant];
    return base && base.length > 0 ? base : undefined;
  }, [fallbackSnapPoint, variant]);

  return (
    <CustomBottomSheet
      ref={ref}
      enableDynamicSizing={enableDynamicSizing ?? true}
      {...(resolvedSnapPoints ? { snapPoints: resolvedSnapPoints } : {})}
      {...rest}
    >
      {children}
    </CustomBottomSheet>
  );
}

const CustomModal = forwardRef<BottomSheetHandle, AllowedProps>(CustomModalComponent);

export type CustomModalProps = AllowedProps;
export default CustomModal;
