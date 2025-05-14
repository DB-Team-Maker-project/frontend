// src/pages/MatchingPage.js
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext, DataContext } from '../App';
import MemberInfoPopup from '../components/Team/MemberInfoPopup';
import * as api from '../services/api';

const MatchingPage = () => {
  const { projectId: projectIdStr } = useParams(); // URL 파라미터는 문자열
  const projectId = parseInt(projectIdStr); // API 호출 시 숫자로 변환
  const { currentUser, logout, isLoading: authIsLoading, setIsLoading: setAuthIsLoading } = useContext(AuthContext);
  const { projects } = useContext(DataContext); // 전체 프로젝트 목록 (현재 프로젝트 정보 가져오기 위함)

  const [project, setProject] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]); // 미완성 팀들
  const [myTeamApplications, setMyTeamApplications] = useState([]); // 내가 이 프로젝트의 팀들에 지원한 내역
  const [selectedUserIdForPopup, setSelectedUserIdForPopup] = useState(null);
  const [pageIsLoading, setPageIsLoading] = useState(false);

  const loadProjectDetails = useCallback(() => {
    const currentProj = projects.find(p => p.id === projectIdStr);
    if (currentProj) {
      setProject(currentProj);
    } else if (projects.length > 0) { // projects 로드는 되었으나 해당 ID가 없을 때
      alert("대회 정보를 찾을 수 없습니다.");
      navigate('/main');
    }
  }, [projects, projectIdStr, navigate]);

  const loadTeamsAndMyApplications = useCallback(async () => {
    if (!currentUser || !currentUser.id || !project) return;
    setPageIsLoading(true);
    try {
      const teamsData = await api.fetchProjectTeams(projectId); // API는 숫자 pid
      setAvailableTeams(teamsData.filter(team => !team.is_complete)); // FastAPI는 is_complete

      const myAppsData = await api.fetchMySentApplications(currentUser.id);
      setMyTeamApplications(myAppsData.filter(app => app.project_id === projectId)); // 현재 프로젝트 관련 지원만
    } catch (error) {
      console.error("팀 또는 내 지원 정보 로드 실패:", error);
      // alert("정보를 불러오는 데 실패했습니다: " + error.message);
    } finally {
      setPageIsLoading(false);
    }
  }, [currentUser, project, projectId]);

  useEffect(() => {
    loadProjectDetails();
  }, [loadProjectDetails]);

  useEffect(() => {
    if (project) { // 프로젝트 정보가 로드된 후 팀 정보 로드
        loadTeamsAndMyApplications();
    }
  }, [project, loadTeamsAndMyApplications]);


  const handleTeamApply = async (teamId) => {
    if (!currentUser || !currentUser.id || !project) return;
    setAuthIsLoading(true);
    try {
      await api.applyToJoinTeam(currentUser.id, parseInt(teamId));
      alert("팀에 성공적으로 지원했습니다.");
      await loadTeamsAndMyApplications(); // 지원 후 내역 새로고침
    } catch (error) {
      alert(error.message);
    } finally {
      setAuthIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!currentUser || !currentUser.id || !project) return;
    setAuthIsLoading(true);
    try {
      const response = await api.createTeamForProject(currentUser.id, projectId); // API는 숫자 pid
      alert(response.message || "새로운 팀이 개설되었습니다.");
      navigate(`/team/${projectId}/${response.team_id}`); // FastAPI 응답은 team_id
    } catch (error) {
      alert(error.message);
    } finally {
      setAuthIsLoading(false);
    }
  };

  const navBarStyle = {display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', marginBottom: '20px'};
  const navButtonStyle = {marginLeft: '10px', padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'};

  if (authIsLoading || (pageIsLoading && !project)) {
      return <div className="global-loader">정보를 불러오는 중...</div>;
  }
  if (!project) {
      return <div style={{padding: '20px', textAlign: 'center'}}>대회 정보를 찾을 수 없습니다. <button onClick={() => navigate('/main')}>메인으로</button></div>;
  }


  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      <div style={navBarStyle}>
        <h2 style={{ fontSize: '1.5em', margin: 0 }}>{project.name} - 팀 매칭</h2>
        <div>
          {/* <button onClick={() => navigate('/notifications')} style={navButtonStyle}>알림</button> */}
          <button onClick={() => { logout(); navigate('/login');}} style={{...navButtonStyle, background: '#dc3545'}} disabled={authIsLoading}>로그아웃</button>
        </div>
      </div>

      <h3 style={{marginBottom: '20px'}}>참여 가능한 팀 목록</h3>
      {pageIsLoading && availableTeams.length === 0 && <p>팀 목록을 불러오는 중...</p>}
      {!pageIsLoading && availableTeams.length === 0 && <p>현재 참여 가능한 팀이 없습니다. 새로운 팀을 개설해보세요!</p>}

      {availableTeams.map(team => {
        const leaderInfo = team.leader_info; // FastAPI 응답에서 leader_info 객체 사용
        const memberCount = team.members ? team.members.length : 0; // 팀장도 멤버에 포함되어 count될 수 있으므로 API 응답 구조 확인 필요
                                                                     // 현재 FastAPI list_teams 응답은 leader_info와 members 배열을 별도로 줌.
                                                                     // 팀장은 members 배열에 포함시키거나, (1 + members.length)로 계산.
                                                                     // FastAPI의 Member 테이블은 팀장도 포함하므로, team.members.length가 총 인원일 수 있음.
                                                                     // 여기서는 API가 반환하는 members 배열의 길이를 사용.
        const isAppliedByMe = myTeamApplications.some(app => String(app.team_id) === team.id && app.status === 0); // 대기중인 지원
        const isAcceptedByMe = myTeamApplications.some(app => String(app.team_id) === team.id && app.status === 1); // 수락된 지원

        let applyButton;
        if (isAcceptedByMe) {
            applyButton = <span style={{ color: 'blue', fontWeight: 'bold' }}>이 팀에 소속됨</span>;
        } else if (isAppliedByMe) {
            applyButton = <span style={{ color: 'green', fontWeight: 'bold' }}>신청 완료 (대기중)</span>;
        } else {
            applyButton = (
                <button onClick={() => handleTeamApply(team.id)}
                        disabled={authIsLoading || pageIsLoading || memberCount >= project.maxTeamSize}
                        style={{padding: '8px 12px', background: '#28a745', color: 'white' }}>
                    {memberCount >= project.maxTeamSize ? "인원 마감" : "이 팀에 지원"}
                </button>
            );
        }


        return (
          <div key={team.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px', background: 'white' }}>
            <h4>팀 ID: {team.id} (현재 {memberCount}명 / 최대 {project.maxTeamSize}명)</h4>
            {leaderInfo && (
              <p><strong>팀장:</strong> <span onClick={() => setSelectedUserIdForPopup(leaderInfo.id)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>{leaderInfo.name}</span></p>
            )}
            <p><strong>팀원:</strong></p>
            {team.members && team.members.length > 0 ? (
              <ul style={{ paddingLeft: '20px', margin: '0 0 10px 0' }}>
                {team.members.map(member => (
                  member.id !== team.leader_id && // 팀장은 위에서 표시했으므로 제외 (선택적)
                  <li key={member.id}>
                    <span onClick={() => setSelectedUserIdForPopup(member.id)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>{member.name}</span>
                  </li>
                ))}
              </ul>
            ) : <p style={{ marginLeft: '20px' }}>아직 팀원이 없습니다. (팀장 제외)</p>}
            {applyButton}
          </div>
        );
      })}

      <div style={{ position: 'fixed', bottom: '30px', right: '30px' }}>
        <button onClick={handleCreateTeam} style={{ padding: '12px 20px', backgroundColor: '#5cb85c', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1em', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} disabled={authIsLoading || pageIsLoading}>
          + 새로운 팀 개설
        </button>
      </div>

      {selectedUserIdForPopup && (
        <MemberInfoPopup userId={selectedUserIdForPopup} onClose={() => setSelectedUserIdForPopup(null)} />
      )}
    </div>
  );
};
export default MatchingPage;