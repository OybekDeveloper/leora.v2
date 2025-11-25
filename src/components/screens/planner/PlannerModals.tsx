import React, { useCallback, useEffect, useRef } from 'react';

import PlannerGoalModal, { GoalModalHandle } from '@/components/modals/planner/GoalModal';
import PlannerFocusModal from '@/components/modals/planner/FocusModal';
import AddTaskSheet, { AddTaskSheetHandle } from '@/components/modals/planner/AddTaskSheet';
import { useModalStore } from '@/stores/useModalStore';
import { useShallow } from 'zustand/react/shallow';
import { useLocalization } from '@/localization/useLocalization';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { buildPayloadFromTask, buildDomainTaskInputFromPayload } from '@/features/planner/taskAdapters';
import type { AddTaskPayload } from '@/types/planner';

export default function PlannerModals() {
  const { plannerTaskModal, plannerGoalModal, closePlannerTaskModal, closePlannerGoalModal } = useModalStore(
    useShallow((state) => ({
      plannerTaskModal: state.plannerTaskModal,
      plannerGoalModal: state.plannerGoalModal,
      closePlannerTaskModal: state.closePlannerTaskModal,
      closePlannerGoalModal: state.closePlannerGoalModal,
    })),
  );
  const sheetRef = useRef<AddTaskSheetHandle>(null);
  const goalModalRef = useRef<GoalModalHandle>(null);
  const { tasks, createTask, updateTask } = usePlannerDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      createTask: state.createTask,
      updateTask: state.updateTask,
    })),
  );
  const { strings } = useLocalization();
  const taskStrings = strings.plannerScreens.tasks;

  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      if (plannerTaskModal.isOpen) {
        closePlannerTaskModal();
      }
      return;
    }

    if (!plannerTaskModal.isOpen) {
      sheetRef.current?.close();
      return;
    }

    if (plannerTaskModal.mode === 'edit' && plannerTaskModal.taskId) {
      const existing = tasks.find((task) => task.id === plannerTaskModal.taskId);
      if (existing) {
        const payload = buildPayloadFromTask(existing, taskStrings);
        sheetRef.current?.edit(payload, { taskId: existing.id });
        return;
      }
    }

    if (plannerTaskModal.goalId) {
      sheetRef.current?.edit({ goalId: plannerTaskModal.goalId });
      return;
    }

    sheetRef.current?.open();
  }, [
    closePlannerTaskModal,
    plannerTaskModal.isOpen,
    plannerTaskModal.mode,
    plannerTaskModal.taskId,
    plannerTaskModal.goalId,
    taskStrings,
    tasks,
  ]);

  const handleSubmit = useCallback(
    (payload: AddTaskPayload, options?: { editingTaskId?: string }) => {
      const input = buildDomainTaskInputFromPayload(payload, taskStrings);
      if (options?.editingTaskId) {
        updateTask(options.editingTaskId, {
          ...input,
          updatedAt: new Date().toISOString(),
        });
      } else {
        createTask({
          ...input,
          id: undefined,
          userId: 'local-user',
          status: 'planned',
          priority: input.priority ?? 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [createTask, taskStrings, updateTask],
  );

  // Manage GoalModal
  const hasHydratedGoalRef = useRef(false);

  useEffect(() => {
    if (!hasHydratedGoalRef.current) {
      hasHydratedGoalRef.current = true;
      if (plannerGoalModal.isOpen) {
        closePlannerGoalModal();
      }
      return;
    }

    if (!plannerGoalModal.isOpen) {
      goalModalRef.current?.dismiss();
      return;
    }

    if (plannerGoalModal.mode === 'edit' && plannerGoalModal.goalId) {
      goalModalRef.current?.edit(plannerGoalModal.goalId);
      return;
    }

    goalModalRef.current?.present();
  }, [
    closePlannerGoalModal,
    plannerGoalModal.isOpen,
    plannerGoalModal.mode,
    plannerGoalModal.goalId,
  ]);

  return (
    <>
      <AddTaskSheet
        ref={sheetRef}
        onCreate={(payload, options) => {
          handleSubmit(payload, { editingTaskId: options?.editingTaskId });
          if (!options?.keepOpen) {
            closePlannerTaskModal();
          }
        }}
        onDismiss={closePlannerTaskModal}
      />
      <PlannerGoalModal ref={goalModalRef} />
      <PlannerFocusModal />
    </>
  );
}
