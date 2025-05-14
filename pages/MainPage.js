// src/pages/MainPage.js
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, DataContext } from '../App';
import * as api from '../services/api'; // API 직접 호출

const MainPage = () => {
  const { currentUser, logout, isLoading: authIsLoading, setIsLoading: setAuthIsLoading } = useContext(AuthContext);
  const { projects, loadProjects } = useContext(DataContext); // App.js에서 projects와 loadProjects 사용
  const navigate = useNavigate();

  const [myParticipations, setMyParticipations] = useState([]); // 내가 참가한 대회 객체 목록
  const [myProjectTeams, setMyProjectTeams] = useState({}); // { projectId: teamObject } 내가 속한 팀 정보
  const [pageIsLoading, setPageIsLoading] = useState(false);
  const [today, setToday] = useState('');

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setToday(`${year}-${month}-${day}`);
  }, []);

  const loadMyData = useCallback(async () => {
    if (!currentUser || !currentUser.id) return;
    setPageIsLoading(true);
    try {
      const participationsData = await api.fetchMyParticipatedCompetitions(currentUser.id);
      setMyParticipations(participationsData);

      // 내가 속한 팀 정보 가져오기 (모든 프로젝트에 대해)
      const teamsData = {};
      for (const project of projects) { // DataContext의 projects 사용
          const teamsInProject = await api.fetchProjectTeams(parseInt(project.id)); // API는 숫자 pid
          const userTeam = teamsInProject.find(team =>
              team.leader_id === currentUser.id || (team.members && team.members.some(m => m.id === currentUser.id))
          );
          if (userTeam) {
              teamsData[project.id] = userTeam;
          }
      }
      setMyProjectTeams(teamsData);

    } catch (error) {
      console.error("내 참가/팀 정보 로드 실패:", error);
      // alert("내 정보를 불러오는 데 실패했습니다: " + error.message);
    } finally {
      setPageIsLoading(false);
    }
  }, [currentUser, projects]); // projects가 변경될 때도 내 팀 정보 다시 로드

  useEffect(() => {
    // projects는 DataContext를 통해 App.js에서 로드되므로, 여기서는 내 참가 정보만 로드
    if (currentUser && projects.length > 0) { // projects가 로드된 후 내 데이터 로드
        loadMyData();
    }
  }, [currentUser, projects, loadMyData]); // projects 의존성 추가

  const handleLogout = () => { logout(); /* App.js Route가 /login으로 보냄 */ };

  const handleApplyProject = async (projectId) => {
    if (!currentUser || !currentUser.id) { alert("로그인이 필요합니다."); return; }
    setAuthIsLoading(true);
    try {
      await api.applyForCompetition(currentUser.id, parseInt(projectId));
      alert("대회 참가를 신청했습니다.");
      await loadMyData(); // 내 참가 정보 새로고침
      // loadProjects(); // 전체 프로젝트 목록에 변화는 없으므로 생략 가능
    } catch (error) {
      alert(error.message);
    } finally {
      setAuthIsLoading(false);
    }
  };

  const handleCancelApplication = async (projectId) => {
    if (!currentUser || !currentUser.id) { alert("로그인이 필요합니다."); return; }
    if (window.confirm("정말로 참가를 취소하시겠습니까?")) {
      setAuthIsLoading(true);
      try {
        await api.cancelCompetitionApplication(currentUser.id, parseInt(projectId));
        alert("참가 신청을 취소했습니다.");
        await loadMyData(); // 내 참가 정보 새로고침
      } catch (error) {
        alert(error.message);
      } finally {
        setAuthIsLoading(false);
      }
    }
  };

  // 내가 신청한 프로젝트 목록 필터링 (myParticipations는 이미 API로 가져온 목록)
  const myAppliedProjectsDetails = myParticipations;

  // 신청 가능한 프로젝트 목록 필터링
  const availableProjects = projects.filter(proj => {
    const isApplied = myParticipations.some(p => p.id === proj.id);
    return !isApplied && today < proj.matchingStart;
  });

  const getProjectCardActions = (project) => {
    const userTeamForThisProject = myProjectTeams[project.id];
    const isDuringMatching = today >= project.matchingStart && today <= project.matchingEnd;

    if (today < project.matchingStart) {
      return <button onClick={() => handleCancelApplication(project.id)} style={{ backgroundColor: 'salmon', color: 'white' }} disabled={authIsLoading || pageIsLoading}>신청 취소</button>;
    } else if (isDuringMatching) {
      if (!userTeamForThisProject) {
        return <button onClick={() => navigate(`/match/${project.id}`)} style={{ backgroundColor: 'lightgreen' }} disabled={authIsLoading || pageIsLoading}>매칭 지원</button>;
      } else {
        return <button onClick={() => navigate(`/team/${project.id}/${userTeamForThisProject.id}`)} style={{ backgroundColor: 'lightblue' }} disabled={authIsLoading || pageIsLoading}>팀 정보 확인</button>;
      }
    }
    return <span style={{color: '#777'}}>기간 종료 또는 매칭 중 아님</span>;
  };

  const navBarStyle = {display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 20px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', marginBottom: '20px'};
  const navButtonStyle = {marginLeft: '10px', padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'};

  if (authIsLoading || (pageIsLoading && myParticipations.length === 0 && projects.length === 0)) {
      return <div className="global-loader">정보를 불러오는 중...</div>;
  }


  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      <div style={navBarStyle}>
        <span style={{marginRight: 'auto', fontWeight: 'bold'}}>{currentUser?.name}님 환영합니다!</span>
        {/* <button onClick={() => navigate('/notifications')} style={navButtonStyle}>알림</button> */}
        <button onClick={handleLogout} style={{...navButtonStyle, background: '#dc3545'}} disabled={authIsLoading}>로그아웃</button>
      </div>
      <h1 style={{textAlign: 'center', marginBottom: '30px'}}>TEAMGETHER 메인</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <section>
          <h2 style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px' }}>내가 신청한 대회</h2>
          {myAppliedProjectsDetails.length === 0 && !pageIsLoading ? <p>신청한 대회가 없습니다.</p> :
           myAppliedProjectsDetails.map(project => (
            <div key={project.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px', background: '#fff' }}>
              <h3>{project.name}</h3>
              <p><strong>개최자:</strong> {project.organizer}</p>
              <p><strong>신청 마감:</strong> {project.applicationDeadline}</p>
              <p><strong>매칭 기간:</strong> {project.matchingStart} ~ {project.matchingEnd}</p>
              <p><strong>팀 인원:</strong> {project.minTeamSize} ~ {project.maxTeamSize}명</p>
              <div style={{ marginTop: '10px' }}>{getProjectCardActions(project)}</div>
            </div>
          ))}
          {pageIsLoading && myAppliedProjectsDetails.length === 0 && <p>내 참가 정보를 불러오는 중...</p>}
        </section>

        <hr style={{ border: 0, borderTop: '2px solid black', margin: '0' }} />

        <section>
          <h2 style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px' }}>신청 가능한 대회</h2>
          {availableProjects.length === 0 && !pageIsLoading ? <p>현재 신청 가능한 대회가 없습니다.</p> :
           availableProjects.map(project => (
            <div key={project.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px', background: '#fff' }}>
              <h3>{project.name}</h3>
              <p><strong>개최자:</strong> {project.organizer}</p>
              <p><strong>신청 마감:</strong> {project.applicationDeadline}</p>
              <p><strong>매칭 기간:</strong> {project.matchingStart} ~ {project.matchingEnd}</p>
              <p><strong>팀 인원:</strong> {project.minTeamSize} ~ {project.maxTeamSize}명</p>
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleApplyProject(project.id)} style={{ backgroundColor: 'yellowgreen' }} disabled={authIsLoading || pageIsLoading}>이 대회 참가 신청</button>
              </div>
            </div>
          ))}
           {pageIsLoading && availableProjects.length === 0 && <p>신청 가능 대회 정보를 불러오는 중...</p>}
        </section>
      </div>
    </div>
  );
};
export default MainPage;