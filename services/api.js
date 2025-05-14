// src/services/api.js (이전 답변의 확장된 버전 사용, 백엔드 최종본과 필드명/URL 등 최종 확인)
const API_BASE_URL = 'http://localhost:8000';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: response.statusText || '알 수 없는 서버 오류입니다.' };
    }
    console.error("API Error:", errorData); // 상세 에러 로깅
    throw new Error(errorData.detail || '요청 처리 중 오류가 발생했습니다.');
  }
  if (response.status === 204) return null; // No Content
  return response.json();
};

// --- 인증 ---
export const loginUser = async (studentId, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, password: password }),
  });
  return handleResponse(response); // 응답: { message, user: UserProfile }
};

export const signupUser = async (userData) => {
  const payload = {
    student_id: userData.studentId, password: userData.password, name: userData.name,
    phone_number: userData.contact, languages: userData.languages || "", mbti: userData.mbti || "",
    career: userData.career || "", gender: userData.gender, intro: userData.bio,
  };
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

// --- 대회 (프로젝트) ---
export const fetchCompetitions = async () => {
  const response = await fetch(`${API_BASE_URL}/competitions`);
  const data = await handleResponse(response);
  return data.map(p => ({ // FastAPI(CompetitionOut) -> React 모델 매핑
    id: String(p.pid), name: p.title, organizer: p.host, applicationDeadline: p.apply_date,
    matchingStart: p.match_start, matchingEnd: p.match_end,
    minTeamSize: p.min_members, maxTeamSize: p.max_members,
  }));
};

export const createCompetition = async (compData) => {
  const payload = { // React -> FastAPI(CompetitionCreate) 매핑
    title: compData.name, host: compData.organizer, apply_date: compData.applicationDeadline,
    match_start: compData.matchingStart, match_end: compData.matchingEnd,
    min_members: parseInt(compData.minTeamSize), max_members: parseInt(compData.maxTeamSize),
  };
  const response = await fetch(`${API_BASE_URL}/competitions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  return handleResponse(response); // CompetitionOut
};

export const updateCompetitionAPI = async (pid, compData) => { // pid는 숫자
    const payload = {
        title: compData.name, host: compData.organizer, apply_date: compData.applicationDeadline,
        match_start: compData.matchingStart, match_end: compData.matchingEnd,
        min_members: parseInt(compData.minTeamSize), max_members: parseInt(compData.maxTeamSize),
    };
    const response = await fetch(`${API_BASE_URL}/competitions/${pid}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return handleResponse(response); // CompetitionOut
};


export const deleteCompetitionAPI = async (pid) => { // pid는 숫자
  const response = await fetch(`${API_BASE_URL}/competitions/${pid}`, { method: 'DELETE' });
  return handleResponse(response);
};

// --- 참가 ---
export const applyForCompetition = async (studentId, competitionId) => { // competitionId는 숫자 pid
  const response = await fetch(`${API_BASE_URL}/participate/${studentId}/${competitionId}`, { method: 'POST' });
  return handleResponse(response);
};

export const cancelCompetitionApplication = async (studentId, competitionId) => { // competitionId는 숫자 pid
  const response = await fetch(`${API_BASE_URL}/participate/${studentId}/${competitionId}`, { method: 'DELETE' });
  return handleResponse(response);
};

export const fetchMyParticipatedCompetitions = async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/participations/${studentId}`);
    const data = await handleResponse(response);
    return data.map(p => ({ // FastAPI(CompetitionOut) -> React 모델 매핑
        id: String(p.pid), name: p.title, organizer: p.host, applicationDeadline: p.apply_date,
        matchingStart: p.match_start, matchingEnd: p.match_end,
        minTeamSize: p.min_members, maxTeamSize: p.max_members,
    }));
};

// --- 팀 ---
export const fetchProjectTeams = async (projectId) => { // projectId는 숫자 pid
  const response = await fetch(`${API_BASE_URL}/teams/${projectId}`);
  const teamsData = await handleResponse(response);
  // FastAPI 응답에 이미 leader_info, members (User 객체 포함) 정보가 잘 구성되어 있으므로,
  // id, project_id, team_id 등 프론트엔드에서 사용하는 필드명에 맞게 약간의 조정만 필요할 수 있음.
  return teamsData.map(team => ({
      ...team, // FastAPI에서 반환된 대부분의 필드 사용
      id: String(team.team_id), // React key 및 일관성을 위해 id 사용
      projectId: String(team.project_id),
      members: team.members.map(m => ({ ...m, id: m.student_id, bio: m.intro, contact: m.phone_number })),
      leaderInfo: team.leader_info ? { ...team.leader_info, id: team.leader_info.student_id, bio: team.leader_info.intro, contact: team.leader_info.phone_number } : null,
  }));
};

export const createTeamForProject = async (studentId, projectId) => { // projectId는 숫자 pid
  const response = await fetch(`${API_BASE_URL}/team/create/${studentId}/${projectId}`, { method: 'POST' });
  return handleResponse(response); // { message, team_id }
};

export const applyToJoinTeam = async (studentId, teamId) => { // teamId는 숫자 tid
  const response = await fetch(`${API_BASE_URL}/apply/${studentId}/${teamId}`, { method: 'POST' });
  return handleResponse(response);
};

export const fetchMySentApplications = async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/applications/my/${student_id}`);
    // FastAPI 응답: [{ application_id, team_id, project_id, project_name, team_leader_name, status }]
    return handleResponse(response);
};

// --- 팀 관리 (팀장) ---
export const fetchTeamApplicationsForLeader = async (leaderId) => {
  const response = await fetch(`${API_BASE_URL}/team/applications/${leaderId}`);
  const appsData = await handleResponse(response);
  // FastAPI 응답: [{ application_id, team_id, project_id, status, applicant_info: UserProfile }]
  return appsData.map(app => ({
      ...app,
      // applicant_info의 id, bio, contact 등은 FastAPI 응답을 따름.
      // 필요시 프론트엔드 모델에 맞게 추가 매핑. (예: applicant_info.id -> applicant_info.userId)
  }));
};

export const acceptTeamApplicant = async (teamId, applicantStudentId) => {
  const response = await fetch(`${API_BASE_URL}/accept/${teamId}/${applicantStudentId}`, { method: 'POST' });
  return handleResponse(response);
};

export const rejectTeamApplicant = async (teamId, applicantStudentId) => { // FastAPI에서 POST로 변경됨
  const response = await fetch(`${API_BASE_URL}/reject/${teamId}/${applicantStudentId}`, { method: 'POST' });
  return handleResponse(response);
};

export const confirmProjectTeam = async (teamId) => {
  const response = await fetch(`${API_BASE_URL}/team/confirm/${teamId}`, { method: 'POST' });
  return handleResponse(response);
};

// --- 팀원 ---
export const leaveProjectTeam = async (teamId, studentId) => {
  const response = await fetch(`${API_BASE_URL}/team/leave/${teamId}/${studentId}`, { method: 'DELETE' });
  return handleResponse(response);
};

// --- 사용자 ---
export const fetchUserDetails = async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/users/${studentId}`);
    const user = await handleResponse(response);
    // FastAPI 응답 (UserProfile) -> React 모델 (필요시 매핑)
    return { ...user, bio: user.intro, contact: user.phone_number }; // 예시 매핑
};