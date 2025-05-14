// src/pages/MainPage.js
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, DataContext } from '../App';

const MainPage = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const { projects, participants, teams, addParticipant, removeParticipant } = useContext(DataContext);
  const navigate = useNavigate();
  const [today, setToday] = useState(''); // 오늘 날짜 문자열 (YYYY-MM-DD)

  useEffect(() => {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 설정 (날짜 비교를 위해)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setToday(`${year}-${month}-${day}`);
  }, []);


  if (!currentUser || !projects || !participants || !teams || today === '') {
    return <p>정보를 불러오는 중입니다...</p>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 내가 신청한 프로젝트 목록
  const myAppliedProjectIds = participants
    .filter(p => p.userId === currentUser.id)
    .map(p => p.projectId);
  const myAppliedProjectsDetails = projects.filter(proj => myAppliedProjectIds.includes(proj.id));

  // 신청 가능한 프로젝트 목록
  const availableProjects = projects.filter(proj => {
    const isApplied = myAppliedProjectIds.includes(proj.id);
    // 오늘 날짜가 매칭지원기간의 시작일자 전인 프로젝트
    const isBeforeMatchingStartForApplication = today < proj.matchingStart;
    return !isApplied && isBeforeMatchingStartForApplication;
  });

  const handleProjectAction = (project) => {
    // 현재 사용자가 해당 프로젝트의 팀에 속해있는지 확인
    const userTeamForProject = teams.find(team =>
        team.projectId === project.id &&
        (team.leaderId === currentUser.id || team.members.includes(currentUser.id))
    );

    const isDuringMatchingPeriod = today >= project.matchingStart && today <= project.matchingEnd;

    if (today < project.matchingStart) { // 오늘 날짜가 매칭지원기간 시작일자 전
      return (
        <button onClick={() => {
          if (window.confirm("정말로 이 프로젝트의 참가를 취소하시겠습니까?")) {
            removeParticipant(currentUser.id, project.id);
          }
        }} style={{ backgroundColor: 'salmon', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px' }}>
          신청 취소
        </button>
      );
    } else if (isDuringMatchingPeriod) { // 오늘 날짜가 매칭지원기간 중
      if (!userTeamForProject) { // 팀 DB 상에서 해당 프로젝트의 어느 팀에도 소속되지 않았을 경우
        return (
          <button onClick={() => navigate(`/match/${project.id}`)} style={{ backgroundColor: 'lightgreen', padding: '8px 12px', border: 'none', borderRadius: '4px' }}>
            매칭 지원
          </button>
        );
      } else { // 팀 DB 상에서 해당 프로젝트의 어느 팀에 소속되어 있을 경우
        return (
          <button onClick={() => navigate(`/team/${project.id}/${userTeamForProject.id}`)} style={{ backgroundColor: 'lightblue', padding: '8px 12px', border: 'none', borderRadius: '4px' }}>
            팀 정보 확인
          </button>
        );
      }
    }
    return null; // 그 외의 경우 (예: 매칭 기간 종료) 버튼 없음
  };

  const commonNavbarStyle = {
    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
    padding: '10px 20px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', marginBottom: '20px'
  };
  const navButtonStyle = {
     marginLeft: '10px', padding: '8px 15px', background: '#6c757d', color: 'white',
     border: 'none', borderRadius: '4px', cursor: 'pointer'
  };


  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      <div style={commonNavbarStyle}>
          {/* <button onClick={() => navigate('/notifications')} style={navButtonStyle}>알림</button> */}
          <button onClick={handleLogout} style={{...navButtonStyle, background: '#dc3545'}}>로그아웃</button>
      </div>
      <h1 style={{textAlign: 'center', marginBottom: '30px'}}>메인 화면</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <section>
          <h2 style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px' }}>내가 신청한 프로젝트</h2>
          {myAppliedProjectsDetails.length === 0 ? <p>신청한 프로젝트가 없습니다.</p> : (
            myAppliedProjectsDetails.map(project => (
              <div key={project.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px', background: '#fff' }}>
                <h3>{project.name}</h3>
                <p><strong>개최자:</strong> {project.organizer}</p>
                <p><strong>대회 신청 마감일:</strong> {project.applicationDeadline}</p>
                <p><strong>매칭 지원 기간:</strong> {project.matchingStart} ~ {project.matchingEnd}</p>
                <p><strong>팀 인원:</strong> {project.minTeamSize}명 ~ {project.maxTeamSize}명</p>
                <div style={{ marginTop: '10px' }}>
                  {handleProjectAction(project)}
                </div>
              </div>
            ))
          )}
        </section>

        <hr style={{ border: 0, borderTop: '2px solid black', margin: '0' }} />

        <section>
          <h2 style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px' }}>신청 가능한 프로젝트</h2>
          {availableProjects.length === 0 ? <p>현재 신청 가능한 프로젝트가 없습니다.</p> : (
            availableProjects.map(project => (
              <div key={project.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px', background: '#fff' }}>
                <h3>{project.name}</h3>
                <p><strong>개최자:</strong> {project.organizer}</p>
                <p><strong>대회 신청 마감일:</strong> {project.applicationDeadline}</p>
                <p><strong>매칭 지원 기간:</strong> {project.matchingStart} ~ {project.matchingEnd}</p>
                <p><strong>팀 인원:</strong> {project.minTeamSize}명 ~ {project.maxTeamSize}명</p>
                <div style={{ marginTop: '10px' }}>
                  <button onClick={() => {
                    addParticipant(currentUser.id, project.id);
                    alert(`'${project.name}' 프로젝트에 참가 신청되었습니다.`);
                    // 상태가 업데이트되면 자동으로 리렌더링됩니다.
                  }} style={{ backgroundColor: 'yellowgreen', padding: '8px 12px', border: 'none', borderRadius: '4px' }}>
                    신청
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default MainPage;