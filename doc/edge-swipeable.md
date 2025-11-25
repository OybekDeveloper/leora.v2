# EdgeSwipeable

`EdgeSwipeable` wraps `react-native-gesture-handler`'s `Swipeable` and limits where the swipe gesture is allowed to begin. Instead of relying on JS touch listeners (which can fire too late on Android), it shrinks `Swipeable`'s hit area from the left by using negative `hitSlop` values. This ensures only the trailing edge (e.g., the right-most 20%) reacts to the swipe gesture on every platform.

## Why use it?
- Prevents accidental swipes while scrolling long lists.
- Reproduces the familiar "Mail style" interaction: swipe from the trailing edge to reveal actions.
- Encapsulates the Android quirks so you can reuse the pattern everywhere.

## Basic usage
```tsx
import EdgeSwipeable from '@/components/shared/EdgeSwipeable';

<EdgeSwipeable
  activationEdgeRatio={0.2} // allow the last 20% to initiate the swipe
  overshootRight={false}
  rightThreshold={80}
  renderRightActions={() => (
    <View style={styles.actionsRow}>
      {/* action buttons */}
    </View>
  )}
>
  <TaskCardContent />
</EdgeSwipeable>
```

### Props
- `activationEdgeRatio` (default `0.2`): Portion of the width that should react to the swipe. Set `0.25` for 25%, etc.
- Every other prop is forwarded directly to RNGH's `Swipeable`.

### Notes
- The component uses `onLayout` to measure the card width, then applies a negative `hitSlop.left` to "trim" the gesture area.
- Because the restriction happens natively, Android and iOS behave identically.
- The forwarded `ref` still exposes the original `Swipeable` instance, so you can call `close()` or `openLeft()` from your card logic.

## Extending
Need different sides or a fixed pixel width? Fork the component and adjust the `hitSlop` calculation. The pattern can also be composed with other wrappers (e.g., analytics HOCs) because it simply renders a `<Swipeable>` internally.
