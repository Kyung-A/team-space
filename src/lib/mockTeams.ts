/**
 * 백엔드(Supabase) 연결 전 단계의 임시 목업 데이터 + 검증 로직.
 * 인메모리 배열이라 앱을 새로고침(전체 리로드)하면 시드 상태로 초기화된다.
 * Supabase 연동 시 이 파일의 함수 시그니처를 유지한 채 내부 구현만 교체한다.
 */

export type Role = 'admin' | 'member';

interface MockTeam {
  name: string;
  /** 멤버 초대 코드 */
  memberCode: string;
  /** 운영진 초대 코드 */
  adminCode: string;
  /** 팀 내 멤버 이름 목록 (운영진 포함). 팀 내 동명이인 방지에 사용 */
  members: string[];
}

/** 중복·합류 검증을 시연하기 위한 시드 팀 */
const teams: MockTeam[] = [
  {
    name: '드림팀',
    memberCode: 'DREAM-M',
    adminCode: 'DREAM-A',
    members: ['김운영'],
  },
];

/** 검증 실패 시 오류를 띄울 입력 필드 식별자 */
export type CreateTeamField = 'name' | 'memberCode' | 'adminCode' | 'ownerName';
export type JoinTeamField = 'code' | 'name';

export type CreateTeamResult =
  | { ok: true; teamName: string }
  | { ok: false; field: CreateTeamField; message: string };

export type JoinTeamResult =
  | { ok: true; role: Role; teamName: string }
  | { ok: false; field: JoinTeamField; message: string };

interface CreateTeamInput {
  name: string;
  memberCode: string;
  adminCode: string;
  ownerName: string;
}

/**
 * 팀 생성. 통과 시 인메모리에 추가하고 생성자는 운영진 권한을 갖는다(기획서 시나리오 A).
 * 검증:
 *  - 팀 이름 / 멤버 코드 / 운영진 코드는 전체에서 유일 (#3)
 *  - 멤버 코드와 운영진 코드는 서로 달라야 함 (#4)
 */
export function createTeam(input: CreateTeamInput): CreateTeamResult {
  const name = input.name.trim();
  const memberCode = input.memberCode.trim();
  const adminCode = input.adminCode.trim();
  const ownerName = input.ownerName.trim();

  if (!name) return { ok: false, field: 'name', message: '팀 이름을 입력해 주세요.' };
  if (!memberCode)
    return { ok: false, field: 'memberCode', message: '멤버 초대 코드를 입력해 주세요.' };
  if (!adminCode)
    return { ok: false, field: 'adminCode', message: '운영진 초대 코드를 입력해 주세요.' };
  if (!ownerName)
    return { ok: false, field: 'ownerName', message: '본인 이름을 입력해 주세요.' };

  // #4: 멤버 코드 ≠ 운영진 코드
  if (memberCode === adminCode) {
    return {
      ok: false,
      field: 'adminCode',
      message: '멤버 코드와 운영진 코드는 서로 다르게 정해 주세요.',
    };
  }

  // #3: 팀 이름 전역 유일
  if (teams.some((t) => t.name === name)) {
    return {
      ok: false,
      field: 'name',
      message: '이미 사용 중인 팀 이름이에요. 다른 이름을 입력해 주세요.',
    };
  }

  // #3: 코드 전역 유일 (모든 팀의 멤버·운영진 코드를 통틀어 검사)
  const usedCodes = teams.flatMap((t) => [t.memberCode, t.adminCode]);
  if (usedCodes.includes(memberCode)) {
    return {
      ok: false,
      field: 'memberCode',
      message: '이미 사용 중인 팀 코드예요. 다른 코드를 입력해 주세요.',
    };
  }
  if (usedCodes.includes(adminCode)) {
    return {
      ok: false,
      field: 'adminCode',
      message: '이미 사용 중인 팀 코드예요. 다른 코드를 입력해 주세요.',
    };
  }

  teams.push({ name, memberCode, adminCode, members: [ownerName] });
  return { ok: true, teamName: name };
}

interface JoinTeamInput {
  code: string;
  name: string;
}

/**
 * 팀 합류 신청. 코드가 어떤 팀의 멤버/운영진 코드에 매칭되는지 조회한다.
 * 매칭된 코드 종류로 role을 판별한다(기획서 시나리오 B).
 * #5: 이름은 같은 팀 안에서만 유일하면 된다(다른 팀과는 동명이인 허용).
 */
export function joinTeam(input: JoinTeamInput): JoinTeamResult {
  const code = input.code.trim();
  const name = input.name.trim();

  if (!code) return { ok: false, field: 'code', message: '팀 코드를 입력해 주세요.' };
  if (!name) return { ok: false, field: 'name', message: '본인 이름을 입력해 주세요.' };

  // 코드는 전역 유일하므로 운영진/멤버 코드 매칭은 상호 배타적이다.
  const adminTeam = teams.find((t) => t.adminCode === code);
  const memberTeam = teams.find((t) => t.memberCode === code);
  const team = adminTeam ?? memberTeam;

  if (!team) {
    return {
      ok: false,
      field: 'code',
      message: '존재하지 않는 팀 코드예요. 코드를 다시 확인해 주세요.',
    };
  }

  // #5: 같은 팀 내 동명이인 금지
  if (team.members.includes(name)) {
    return {
      ok: false,
      field: 'name',
      message: '팀에 이미 같은 이름의 멤버가 있어요. 다른 이름을 사용해 주세요.',
    };
  }

  const role: Role = adminTeam ? 'admin' : 'member';
  team.members.push(name);
  return { ok: true, role, teamName: team.name };
}
