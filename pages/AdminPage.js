// src/pages/AdminPage.js
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, DataContext } from '../App';

const AdminPage = () => {
  const { logout, currentUser, isLoading } = useContext(AuthContext);
  const { projects, loadProjects, handleDeleteProject } = useContext(DataContext);
  const navigate = useNavigate();

  useEffect(() => {
    // loadProjects는 App.js에서 currentUser 변경 시 또는 마운트 시 호출되므로,
    // 여기서 별도로 호출할 필요는 없을 수 있으나, 명시적으로 다시 로드하고 싶다면 호출
    if (currentUser && currentUser.isAdmin) {
        loadProjects();
    }
  }, [currentUser, loadProjects]);

  const handleLogout = () => {
    logout();
    // navigate('/login'); // App.js의 Route가 처리
  };

  const onProjectDelete = async (projectId) => {
    await handleDeleteProject(projectId);
    // loadProjects(); // handleDeleteProject 내부에서 목록 갱신 (App.js 참고)
  };

  if (isLoading && projects.length === 0) { // 초기 로딩 중이면서 데이터가 없을 때
    return <div style={{ padding: '20px', textAlign: 'center' }}>프로젝트 목록을 불러오는 중...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
        <h2>관리자 화면 - 대회 목록</h2>
        <button onClick={handleLogout} style={{ padding: '10px 18px', background: '#dc3545', color: 'white' }} disabled={isLoading}>로그아웃</button>
      </div>

      {projects.length === 0 && !isLoading ? <p style={{textAlign: 'center'}}>등록된 대회가 없습니다. 우측 하단의 버튼으로 새 대회를 추가해보세요.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
          {projects.map(project => (
            <div key={project.id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#007bff' }}>{project.name}</h3>
              <p><strong>개최자:</strong> {project.organizer}</p>
              <p><strong>대회 신청 마감일:</strong> {project.applicationDeadline}</p>
              <p><strong>매칭 지원 기간:</strong> {project.matchingStart} ~ {project.matchingEnd}</p>
              <p><strong>팀 최소 인원:</strong> {project.minTeamSize}명</p>
              <p><strong>팀 최대 인원:</strong> {project.maxTeamSize}명</p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => navigate(`/admin/project/edit/${project.id}`)} style={{ background: '#28a745', color: 'white' }} disabled={isLoading}>수정</button>
                <button onClick={() => onProjectDelete(project.id)} style={{ background: '#ffc107', color: 'black' }} disabled={isLoading}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '40px', right: '40px' }}>
        <button onClick={() => navigate('/admin/project/new')} style={{ padding: '15px 25px', fontSize: '1.1em', backgroundColor: '#007bff', color: 'white', borderRadius: '50px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }} disabled={isLoading}>
          + 대회 추가
        </button>
      </div>
    </div>
  );
};
export default AdminPage;