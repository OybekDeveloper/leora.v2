You are modifying a React-Native + Expo Router project.

Goal:
Convert the following modals into router-based native modals:
1) HabitModal
2) GoalModal
3) TaskModal

They must open exactly like add-account.tsx modal:
- Using Expo Router's <Stack.Screen presentation="modal">
- Modal animation must be native iOS/Android modal animation
- Modal must open on separate route: /modals/habit, /modals/goal, /modals/task
- UI and logic must remain unchanged inside the modals
- Only navigation method is switched to router-based modals
- Modal background must be dimmed (native modal backdrop)

Requirements:

1. Create folder:
   app/modals/
       habit.tsx
       goal.tsx
       task.tsx

2. Each modal must export a component containing the previous modal UI:
   Example:
   export default function HabitModalScreen() { return <HabitModal /> }

3. In app/_layout.tsx add:
   <Stack>
      ...
      <Stack.Screen name="/(modals)/planner/habit" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="/(modals)/planner/goal" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="/(modals)/planner/task" options={{ presentation: "modal", headerShown: false }} />
   </Stack>

4. Replace all previous “open modal” logic (BottomSheet, custom modals, etc.) with router navigation:
   import { router } from "expo-router"

   router.push("/(modals)/planner/habit")
   router.push("/(modals)/planner/goal")
   router.push("/(modals)/planner/task")

5. Closing the modal must use router.back()

6. Ensure scroll, keyboard handling, safe area and internal logic works same as before.

7. Do NOT change the design or markup of HabitModal, GoalModal, TaskModal.
   Only wrap them inside modal screens.

8. Output:
   - Updated folder structure
   - Modified _layout.tsx
   - New modal screen files
   - Updated navigation calls
   - Ensure TypeScript correctness
