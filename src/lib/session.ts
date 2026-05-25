import { create } from 'zustand';
import type { Role } from './mockTeams';

/**
 * 현재 사용자(로그인 상태) 클라이언트 상태.
 * 백엔드 연결 전 단계라 인메모리이며, 팀 생성 시 운영진으로 세팅된다.
 * Supabase 연동 시 세션 복원 로직으로 setSession을 채운다.
 */
interface SessionState {
  teamName: string | null;
  userName: string | null;
  role: Role | null;
  setSession: (s: { teamName: string; userName: string; role: Role }) => void;
  clear: () => void;
  /** 개발용: 운영진/멤버 뷰를 전환해 화면을 확인하기 위한 임시 토글 */
  toggleRole: () => void;
}

export const useSession = create<SessionState>((set) => ({
  teamName: null,
  userName: null,
  role: null,
  setSession: ({ teamName, userName, role }) =>
    set({ teamName, userName, role }),
  clear: () => set({ teamName: null, userName: null, role: null }),
  toggleRole: () =>
    set((s) => ({ role: s.role === 'admin' ? 'member' : 'admin' })),
}));
