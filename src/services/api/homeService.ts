import { Goal, ProgressData, Task } from "@/types/home";

interface HomeResponse {
  tasks: Task[];
  goals: Goal[];
  progress: ProgressData;
}

export const homeService = {
  async getHomeData(): Promise<HomeResponse> {
    // TODO: Implement API call
    // const response = await fetch(`${API_URL}/home`);
    // return response.json();
    throw new Error('Not implemented');
  },

  async updateTask(_taskId: string, _completed: boolean): Promise<void> {
    // TODO: Implement API call
    // await fetch(`${API_URL}/tasks/${taskId}`, {
    //   method: 'PATCH',
    //   body: JSON.stringify({ completed })
    // });
    throw new Error('Not implemented');
  },

  async updateGoalProgress(_goalId: string, _current: number): Promise<void> {
    // TODO: Implement API call
    throw new Error('Not implemented');
  },
};
