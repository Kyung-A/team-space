/**
 * 일정 목록·상세 화면용 임시 목업 데이터 + 상태 계산 로직.
 * 인메모리라 전체 새로고침 시 시드 상태로 초기화된다.
 * 날짜는 "오늘 기준 상대 오프셋"으로 시드해, 실행일과 무관하게 상태가 일관되게 보이도록 했다.
 * Supabase 연동 시 이 파일의 타입·함수 시그니처를 유지한 채 데이터 소스만 교체한다.
 */

/** 일정 상태 — 공연일(eventDate) 기준 */
export type ScheduleStatus = 'upcoming' | 'ongoing' | 'done' | 'undecided';
/** 연습 세션 상태 — 오늘 날짜 기준 */
export type PracticeStatus = 'upcoming' | 'ongoing' | 'done';

/** 연습 세션의 참여 멤버 (비고란 포함) */
export interface PracticeParticipant {
  name: string;
  note?: string;
}

export interface PracticeSession {
  id: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  location: string;
  participants: PracticeParticipant[];
}

/**
 * 멤버가 본인이 연습 가능하다고 등록한 시간 슬롯.
 * 기획서 availability_slots에 해당.
 * - 1시간 단위 시간대 선택 (예: 14:00~17:00) — 한 날짜에 여러 슬롯 가능
 * - 또는 하루종일(isFullDay=true) 선택
 * - 연속 구간은 단일 row로 저장
 * 일정 수정 시 cascade 대상 (날짜 기준).
 */
export interface AvailabilitySlot {
  id: string;
  userName: string;
  date: string; // 'YYYY-MM-DD'
  isFullDay: boolean;
  startTime?: string; // 'HH:mm' — isFullDay=false일 때만
  endTime?: string;
}

export interface Schedule {
  id: string;
  name: string;
  eventDate: string | null; // 'YYYY-MM-DD' | null(=미확정: 공연일 미정)
  location: string;
  /** 연습 기간 (없으면 null) */
  practiceStart: string | null; // 'YYYY-MM-DD'
  practiceEnd: string | null; // 'YYYY-MM-DD'
  participants: string[]; // 일정 참여 멤버 이름
  practiceSessions: PracticeSession[];
  availabilitySlots: AvailabilitySlot[];
}

export const STATUS_LABEL: Record<ScheduleStatus, string> = {
  upcoming: '진행예정',
  ongoing: '진행중',
  done: '완료',
  undecided: '미확정',
};

export const PRACTICE_STATUS_LABEL: Record<PracticeStatus, string> = {
  upcoming: '예정',
  ongoing: '진행중',
  done: '완료',
};

// --- 날짜 유틸 -------------------------------------------------------------

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 오늘로부터 offset일 떨어진 날짜 (YYYY-MM-DD) */
function fromToday(offsetDays: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return toISODate(d);
}

/** 'YYYY-MM-DD' 문자열은 사전순 비교가 곧 날짜순 비교 */
function compareToToday(iso: string): -1 | 0 | 1 {
  const today = toISODate(new Date());
  return iso < today ? -1 : iso > today ? 1 : 0;
}

// --- 상태 계산 -------------------------------------------------------------

export function getScheduleStatus(s: Schedule): ScheduleStatus {
  if (!s.eventDate) return 'undecided';
  const cmp = compareToToday(s.eventDate);
  return cmp > 0 ? 'upcoming' : cmp === 0 ? 'ongoing' : 'done';
}

export function getPracticeStatus(p: PracticeSession): PracticeStatus {
  const cmp = compareToToday(p.date);
  return cmp < 0 ? 'done' : cmp === 0 ? 'ongoing' : 'upcoming';
}

// --- 시드 데이터 -----------------------------------------------------------

const schedules: Schedule[] = [
  {
    id: 's1',
    name: '정기 공연',
    eventDate: fromToday(20),
    location: '강남 OO홀',
    practiceStart: fromToday(-10),
    practiceEnd: fromToday(18),
    participants: ['김운영', '이보컬', '박드럼', '최베이스'],
    practiceSessions: [
      {
        id: 's1-p1',
        date: fromToday(-7),
        startTime: '19:00',
        endTime: '21:00',
        location: '합주실 A',
        participants: [
          { name: '김운영' },
          { name: '이보컬', note: '30분 늦게 합류' },
          { name: '박드럼' },
        ],
      },
      {
        id: 's1-p2',
        date: fromToday(0),
        startTime: '20:00',
        endTime: '22:00',
        location: '합주실 A',
        participants: [
          { name: '김운영' },
          { name: '이보컬' },
          { name: '박드럼', note: '드럼 세팅 먼저' },
          { name: '최베이스' },
        ],
      },
      {
        id: 's1-p3',
        date: fromToday(10),
        startTime: '19:00',
        endTime: '21:00',
        location: '합주실 B',
        participants: [{ name: '이보컬' }, { name: '최베이스' }],
      },
    ],
    availabilitySlots: [
      // 박드럼 — 같은 날 여러 시간대 + 하루종일 케이스 혼합 (연습 기간: -10 ~ 18)
      {
        id: 's1-a1',
        userName: '박드럼',
        date: fromToday(-3),
        isFullDay: false,
        startTime: '14:00',
        endTime: '17:00',
      },
      {
        id: 's1-a2',
        userName: '박드럼',
        date: fromToday(-3),
        isFullDay: false,
        startTime: '19:00',
        endTime: '22:00',
      },
      {
        id: 's1-a3',
        userName: '박드럼',
        date: fromToday(5),
        isFullDay: true,
      },
      {
        id: 's1-a4',
        userName: '박드럼',
        date: fromToday(12),
        isFullDay: false,
        startTime: '15:00',
        endTime: '18:00',
      },
      // 이보컬 — 연습 기간 끝자락 (수정 시 cascade 시연용)
      {
        id: 's1-a5',
        userName: '이보컬',
        date: fromToday(15),
        isFullDay: false,
        startTime: '20:00',
        endTime: '22:00',
      },
      {
        id: 's1-a6',
        userName: '이보컬',
        date: fromToday(17),
        isFullDay: true,
      },
    ],
  },
  {
    id: 's2',
    name: '버스킹 무대',
    eventDate: fromToday(0),
    location: '홍대 거리',
    practiceStart: fromToday(-5),
    practiceEnd: fromToday(0),
    participants: ['김운영', '이보컬'],
    practiceSessions: [
      {
        id: 's2-p1',
        date: fromToday(-2),
        startTime: '18:00',
        endTime: '20:00',
        location: '합주실 C',
        participants: [
          { name: '김운영' },
          { name: '이보컬', note: '앰프 지참' },
        ],
      },
    ],
    availabilitySlots: [],
  },
  {
    id: 's3',
    name: '봄 워크샵',
    eventDate: fromToday(-12),
    location: '연습실 B',
    practiceStart: fromToday(-18),
    practiceEnd: fromToday(-12),
    participants: ['박드럼', '최베이스'],
    practiceSessions: [
      {
        id: 's3-p1',
        date: fromToday(-15),
        startTime: '14:00',
        endTime: '17:00',
        location: '연습실 B',
        participants: [{ name: '박드럼' }, { name: '최베이스' }],
      },
    ],
    availabilitySlots: [],
  },
  {
    id: 's4',
    name: '신곡 쇼케이스',
    eventDate: null, // 미확정
    location: '미정',
    practiceStart: null,
    practiceEnd: null,
    participants: ['김운영', '이보컬', '박드럼'],
    practiceSessions: [],
    availabilitySlots: [],
  },
  {
    id: 's5',
    name: '연말 콘서트',
    eventDate: fromToday(45),
    location: '올림픽홀',
    practiceStart: fromToday(15),
    practiceEnd: fromToday(43),
    participants: ['이보컬', '최베이스'],
    practiceSessions: [
      {
        id: 's5-p1',
        date: fromToday(20),
        startTime: '19:00',
        endTime: '22:00',
        location: '합주실 A',
        participants: [{ name: '이보컬' }, { name: '최베이스' }],
      },
    ],
    availabilitySlots: [],
  },
];

/** 팀 멤버 로스터 (운영진 포함). 참여 멤버 선택 목록에 사용 */
const TEAM_MEMBERS = ['김운영', '이보컬', '박드럼', '최베이스'];

/** 참여 멤버 선택용 명단. 현재 사용자가 명단에 없으면 맨 앞에 추가한다. */
export function getTeamMembers(currentUserName?: string): string[] {
  if (currentUserName && !TEAM_MEMBERS.includes(currentUserName)) {
    return [currentUserName, ...TEAM_MEMBERS];
  }
  return [...TEAM_MEMBERS];
}

export function getSchedules(): Schedule[] {
  return schedules;
}

export interface NewScheduleInput {
  name: string;
  eventDate: string | null;
  location: string;
  practiceStart: string | null;
  practiceEnd: string | null;
  participants: string[];
}

/** 일정 추가. 새 일정을 목록 맨 앞에 넣고 추가된 일정을 반환한다. */
export function addSchedule(input: NewScheduleInput): Schedule {
  const schedule: Schedule = {
    id: `s${Date.now()}`,
    name: input.name.trim(),
    eventDate: input.eventDate,
    location: input.location.trim(),
    practiceStart: input.practiceStart,
    practiceEnd: input.practiceEnd,
    participants: input.participants,
    practiceSessions: [],
    availabilitySlots: [],
  };
  schedules.unshift(schedule);
  return schedule;
}

export function getScheduleById(id: string): Schedule | undefined {
  return schedules.find((s) => s.id === id);
}

export interface UpdateScheduleInput {
  name: string;
  eventDate: string | null;
  location: string;
  practiceStart: string | null;
  practiceEnd: string | null;
  participants: string[];
}

export interface UpdateScheduleResult {
  schedule: Schedule;
  /** 이번 수정에서 새로 추가된 참여 멤버 (= 이전엔 없었던 사람) */
  addedParticipants: string[];
  /** 이번 수정에서 제외된 참여 멤버 */
  removedParticipants: string[];
  /** cascade로 삭제된 availability_slots 개수 */
  removedAvailability: number;
  /** cascade로 삭제된 practice_sessions 개수 (연습 기간 밖) */
  removedPracticeSessions: number;
  /** cascade로 삭제된 practice_session_participants 개수 (멤버 제외) */
  removedPracticeParticipations: number;
}

/**
 * 일정 수정. 다음 cascade를 함께 처리한다.
 * - 연습 기간 축소/제거: 새 기간 밖 날짜의 practice_sessions + availability_slots 삭제
 * - 참여 멤버 제외: 해당 멤버의 availability_slots + practice_session_participants 삭제
 */
export function updateSchedule(
  id: string,
  input: UpdateScheduleInput
): UpdateScheduleResult | null {
  const idx = schedules.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const prev = schedules[idx];

  const addedParticipants = input.participants.filter(
    (p) => !prev.participants.includes(p)
  );
  const removedParticipants = prev.participants.filter(
    (p) => !input.participants.includes(p)
  );

  let removedAvailability = 0;
  let removedPracticeSessions = 0;
  let removedPracticeParticipations = 0;

  const inPracticeRange = (date: string): boolean => {
    if (!input.practiceStart || !input.practiceEnd) return false;
    return date >= input.practiceStart && date <= input.practiceEnd;
  };

  // 1) 연습 기간 밖 practice_sessions 삭제 (기간이 사라지면 전체 삭제)
  let practiceSessions = prev.practiceSessions.filter((session) => {
    if (!inPracticeRange(session.date)) {
      removedPracticeSessions++;
      return false;
    }
    return true;
  });

  // 2) 남은 practice_sessions의 참여자에서 제외 멤버 제거
  practiceSessions = practiceSessions.map((session) => {
    const filtered = session.participants.filter((p) => {
      if (removedParticipants.includes(p.name)) {
        removedPracticeParticipations++;
        return false;
      }
      return true;
    });
    return { ...session, participants: filtered };
  });

  // 3) availability_slots: 제외 멤버 + 연습 기간 밖 모두 삭제
  const availabilitySlots = prev.availabilitySlots.filter((slot) => {
    if (removedParticipants.includes(slot.userName)) {
      removedAvailability++;
      return false;
    }
    if (!inPracticeRange(slot.date)) {
      removedAvailability++;
      return false;
    }
    return true;
  });

  const updated: Schedule = {
    ...prev,
    name: input.name.trim(),
    eventDate: input.eventDate,
    location: input.location.trim(),
    practiceStart: input.practiceStart,
    practiceEnd: input.practiceEnd,
    participants: input.participants,
    practiceSessions,
    availabilitySlots,
  };
  schedules[idx] = updated;

  return {
    schedule: updated,
    addedParticipants,
    removedParticipants,
    removedAvailability,
    removedPracticeSessions,
    removedPracticeParticipations,
  };
}

/**
 * 데모용: 현재 사용자(이름)를 일부 일정의 참여 멤버로 추가한다.
 * '내가 참여하는 일정' 필터가 실제로 결과를 보여주도록 하기 위함.
 */
export function markMyParticipation(name: string) {
  ['s1', 's2', 's4'].forEach((id) => {
    const s = schedules.find((x) => x.id === id);
    if (s && !s.participants.includes(name)) s.participants.push(name);
  });
}
