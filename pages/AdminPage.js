// src/pages/AdminPage.js
import React, { useContext } from 'react';
import { useNavigate } //, Link
from 'react-router-dom';
import { AuthContext, DataContext } from '../App';

const AdminPage = () => {
  const { logout } = useContext(AuthContext);
  const { projects, deleteProject } = useContext(DataContext);
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
        <h2>관리자 화면 - 프로젝트 목록</h2>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>로그아웃</button>
      </div>

      {projects.length === 0 ? <p>등록된 프로젝트가 없습니다.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {projects.map(project => (
            <div key={project.id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#007bff' }}>{project.name}</h3>
              <p><strong>개최자:</strong> {project.organizer}</p>
              <p><strong>대회 신청 기간:</strong> {project.applicationDeadline}</p>
              <p><strong>매칭 지원 기간:</strong> {project.matchingStart} ~ {project.matchingEnd}</p>
              <p><strong>팀 최소 인원:</strong> {project.minTeamSize}명</p>
              <p><strong>팀 최대 인원:</strong> {project.maxTeamSize}명</p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => navigate(`/admin/project/edit/${project.id}`)} style={{ padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>수정</button>
                <button onClick={() => deleteProject(project.id)} style={{ padding: '8px 12px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '40px', right: '40px' }}>
        <button onClick={() => navigate('/admin/project/new')} style={{ padding: '15px 25px', fontSize: '1.1em', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
          + 프로젝트 추가
        </button>
      </div>
    </div>
  );
};
export default AdminPage;