import React, { forwardRef } from "react";
import {
  KeyboardAwareScrollView as ControllerKeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";

export type AppKeyboardAwareScrollViewRef = KeyboardAwareScrollViewRef;

const KeyboardAwareScrollView = forwardRef<
  KeyboardAwareScrollViewRef,
  KeyboardAwareScrollViewProps
>(function KeyboardAwareScrollView(
  {
    bottomOffset = 96,
    contentInsetAdjustmentBehavior = "automatic",
    keyboardDismissMode = "interactive",
    keyboardShouldPersistTaps = "handled",
    ...props
  },
  ref,
) {
  return (
    <ControllerKeyboardAwareScrollView
      ref={ref}
      bottomOffset={bottomOffset}
      contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
      keyboardDismissMode={keyboardDismissMode}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    />
  );
});

export default KeyboardAwareScrollView;
