// src/App.js
import React, { useState, createContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminPage from './pages/AdminPage';
import ProjectEditPage from './pages/ProjectEditPage';
import MainPage from './pages/MainPage';
import MatchingPage from './pages/MatchingPage';
import TeamInfoPage from './pages/TeamInfoPage';
// import NotificationsPage from './pages/NotificationsPage'; // 알림 페이지 (추후 구현)

// Contexts
export const AuthContext = createContext();
export const DataContext = createContext();

// Initial Dummy Data (실제로는 API를 통해 백엔드에서 관리)
const initialUsers = [
  { id: 'admin01', studentId: 'admin', password: 'password', name: '관리자계정', isAdmin: true, gender: '남성', contact: '01000000000', bio: '시스템 관리자입니다.' },
  { id: 'user01', studentId: '20201111', password: 'user1234', name: '김팀장', isAdmin: false, gender: '남성', contact: '01012340001', bio: '리더십 있는 팀장입니다. 함께 성장할 팀원을 찾습니다!' },
  { id: 'user02', studentId: '20212222', password: 'user5678', name: '이팀원', isAdmin: false, gender: '여성', contact: '01012340002', bio: '꼼꼼하고 성실한 팀원입니다. React와 Node.js에 관심 많습니다.' },
  { id: 'user03', studentId: '20193333', password: 'user0000', name: '박지원', isAdmin: false, gender: '여성', contact: '01012340003', bio: '새로운 기술을 배우는 것을 좋아합니다. 협업 경험 다수.' },
];

const initialProjects = [
  { id: 'proj01', name: 'AI 기반 추천 시스템 개발', organizer: '컴퓨터공학부', applicationDeadline: '2025-08-31', matchingStart: '2025-07-01', matchingEnd: '2025-07-15', minTeamSize: 2, maxTeamSize: 4 },
  { id: 'proj02', name: '블록체인 활용한 투표 시스템', organizer: '소프트웨어학과', applicationDeadline: '2025-09-15', matchingStart: '2025-07-20', matchingEnd: '2025-08-05', minTeamSize: 3, maxTeamSize: 5 },
  { id: 'proj03', name: '모바일 게임 개발 프로젝트', organizer: '게임공학과', applicationDeadline: '2025-08-20', matchingStart: '2025-06-20', matchingEnd: '2025-07-05', minTeamSize: 2, maxTeamSize: 3 },
];

// 앱 실행 시 localStorage에서 데이터 로드, 없으면 초기 데이터 사용
const loadFromLocalStorage = (key, defaultValue) => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

const saveToLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};


function App() {
  const [currentUser, setCurrentUser] = useState(() => loadFromLocalStorage('currentUser', null));
  const [users, setUsers] = useState(() => loadFromLocalStorage('users', initialUsers));
  const [projects, setProjects] = useState(() => loadFromLocalStorage('projects', initialProjects));
  const [participants, setParticipants] = useState(() => loadFromLocalStorage('participants', [])); // { id, userId, projectId }
  const [teams, setTeams] = useState(() => loadFromLocalStorage('teams', [])); // { id, projectId, leaderId, members: [userIds], isComplete: false }
  const [supports, setSupports] = useState(() => loadFromLocalStorage('supports', [])); // { id, userId, teamId, projectId }

  useEffect(() => { saveToLocalStorage('currentUser', currentUser); }, [currentUser]);
  useEffect(() => { saveToLocalStorage('users', users); }, [users]);
  useEffect(() => { saveToLocalStorage('projects', projects); }, [projects]);
  useEffect(() => { saveToLocalStorage('participants', participants); }, [participants]);
  useEffect(() => { saveToLocalStorage('teams', teams); }, [teams]);
  useEffect(() => { saveToLocalStorage('supports', supports); }, [supports]);


  const login = (studentId, password) => {
    const user = users.find(u => u.studentId === studentId && u.password === password);
    if (user) {
      setCurrentUser(user);
      return user;
    }
    alert("학번과 비밀번호를 확인해주세요.");
    return null;
  };

  const logout = () => {
    setCurrentUser(null);
    // navigate to login an App level navigate is not available directly
    // but routes will redirect
  };

  const signup = (userData) => {
    if (users.find(u => u.studentId === userData.studentId)) {
      alert("이미 사용 중인 학번입니다.");
      return false;
    }
    const newUser = { ...userData, id: `user${Date.now()}`, isAdmin: false };
    setUsers(prev => [...prev, newUser]);
    alert("회원가입이 완료되었습니다.");
    return true;
  };

  // Project CRUD
  const addProject = (projectData) => {
    setProjects(prev => [...prev, { ...projectData, id: `proj${Date.now()}` }]);
    alert("프로젝트 생성이 완료되었습니다.");
  };
  const updateProject = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    alert("프로젝트 수정이 완료되었습니다.");
  };
  const deleteProject = (projectId) => {
    if (window.confirm("정말 프로젝트를 삭제하시겠습니까? 연관된 참가, 팀, 지원 정보도 함께 삭제될 수 있습니다.")) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setParticipants(prev => prev.filter(p => p.projectId !== projectId));
      setTeams(prev => prev.filter(t => t.projectId !== projectId));
      setSupports(prev => prev.filter(s => s.projectId !== projectId));
    }
  };

  // Participant actions
    const addParticipant = (userId, projectId) => {
        if (!participants.some(p => p.userId === userId && p.projectId === projectId)) {
            setParticipants(prev => [...prev, { id: `part${Date.now()}`, userId, projectId }]);
        }
    };
    const removeParticipant = (userId, projectId) => {
        setParticipants(prev => prev.filter(p => !(p.userId === userId && p.projectId === projectId)));
    };

  // Team actions (더 많은 로직은 각 페이지에서 Context를 통해 setTeams 등을 호출)
  const dataContextValue = {
    users, setUsers,
    projects, setProjects, addProject, updateProject, deleteProject,
    participants, setParticipants, addParticipant, removeParticipant,
    teams, setTeams,
    supports, setSupports,
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, signup }}>
      <DataContext.Provider value={dataContextValue}>
        <Router>
          <Routes>
            <Route path="/login" element={!currentUser ? <LoginPage /> : (currentUser.isAdmin ? <Navigate to="/admin" /> : <Navigate to="/main" />)} />
            <Route path="/signup" element={!currentUser ? <SignupPage /> : <Navigate to="/login" />} />

            <Route path="/admin" element={<ProtectedRoute isAdminRequired={true}><AdminPage /></ProtectedRoute>} />
            <Route path="/admin/project/new" element={<ProtectedRoute isAdminRequired={true}><ProjectEditPage mode="new" /></ProtectedRoute>} />
            <Route path="/admin/project/edit/:projectId" element={<ProtectedRoute isAdminRequired={true}><ProjectEditPage mode="edit" /></ProtectedRoute>} />

            <Route path="/main" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
            <Route path="/match/:projectId" element={<ProtectedRoute><MatchingPage /></ProtectedRoute>} />
            <Route path="/team/:projectId/:teamId" element={<ProtectedRoute><TeamInfoPage /></ProtectedRoute>} />
            {/* <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} /> */}

            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </DataContext.Provider>
    </AuthContext.Provider>
  );
}

// ProtectedRoute 컴포넌트 (접근 제어)
const ProtectedRoute = ({ children, isAdminRequired = false }) => {
  const { currentUser } = React.useContext(AuthContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    } else if (isAdminRequired && !currentUser.isAdmin) {
      alert("접근 권한이 없습니다.");
      navigate('/main', { replace: true }); // 또는 이전 페이지로
    } else if (!isAdminRequired && currentUser.isAdmin) {
        // 관리자가 일반 사용자 페이지에 접근 시도 시 (선택적 처리)
        // alert("관리자 계정으로는 접근할 수 없는 페이지입니다.");
        // navigate('/admin', { replace: true });
    }
  }, [currentUser, isAdminRequired, navigate]);


  if (!currentUser) return null; // 리디렉션 중 렌더링 방지
  if (isAdminRequired && !currentUser.isAdmin) return null; // 리디렉션 중 렌더링 방지

  return children;
};

export default App;