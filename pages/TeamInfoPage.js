// src/pages/TeamInfoPage.js
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext, DataContext } from '../App';
import MemberInfoPopup from '../components/Team/MemberInfoPopup';
import * as api from '../services/api';

const TeamInfoPage = () => {
  const { projectId: projectIdStr, teamId: teamIdStr } = useParams();
  const projectId = parseInt(projectIdStr);
  const teamId = parseInt(teamIdStr);

  const { currentUser, logout, isLoading: authIsLoading, setIsLoading: setAuthIsLoading } = useContext(AuthContext);
  // const { projects } = useContext(DataContext); // 현재 프로젝트 정보 가져오기 위함 (필요시)

  const [project, setProject] = useState(null); // 현재 보고 있는 대회 정보
  const [team, setTeam] = useState(null); // 현재 보고 있는 팀 상세 정보 (API로 가져옴)
  const [applicantsForMyTeam, setApplicantsForMyTeam] = useState([]); // 내가 팀장인 경우, 내 팀에 지원한 사람들
  const [selectedUserIdForPopup, setSelectedUserIdForPopup] = useState(null);
  const [pageIsLoading, setPageIsLoading] = useState(false);

  // 현재 프로젝트 정보 가져오기 (DataContext에 projects가 이미 있다면 거기서 찾아도 됨)
  const loadProjectDetails = useCallback(async () => {
      // DataContext에 projects가 이미 로드되어 있다고 가정하고 사용
      // const { projects } = useContext(DataContext) 사용하거나,
      // 또는 api.fetchCompetitionDetails(projectId) 같은 API가 있다면 호출
      // 여기서는 projects 상태에서 찾거나, 없으면 API 호출 (간단하게는 projects context에서 찾기)
      // const foundProject = projects.find(p => p.id === projectIdStr);
      // if(foundProject) setProject(foundProject);
      // else { /* API 호출 */ }
      // 임시: API 호출로 프로젝트 정보 가져오도록 구현
      try {
          const allProjects = await api.fetchCompetitions(); // 모든 대회 정보 로드
          const currentProj = allProjects.find(p => p.id === projectIdStr);
          if(currentProj) setProject(currentProj);
          else throw new Error("대회 정보를 찾을 수 없습니다.");
      } catch (error) {
          console.error("대회 정보 로드 실패:", error);
          alert(error.message);
          navigate('/main');
      }
  }, [projectIdStr, navigate]);


  const loadTeamDetailsAndApplicants = useCallback(async () => {
    if (!currentUser || !currentUser.id) return;
    setPageIsLoading(true);
    try {
      // 특정 팀의 상세 정보 가져오기 (API 필요 - 현재 /teams/{pid}는 팀 목록만 반환)
      // 임시로 /teams/{pid}에서 현재 팀 ID에 해당하는 팀을 찾아서 사용
      const teamsInProject = await api.fetchProjectTeams(projectId); // API는 숫자 pid
      const currentTeam = teamsInProject.find(t => t.id === teamIdStr);
      if (!currentTeam) throw new Error("팀 정보를 찾을 수 없습니다.");
      setTeam(currentTeam);

      // 현재 유저가 팀장이고, 팀이 미확정 상태일 때만 지원자 목록 로드
      if (currentUser.id === currentTeam.leader_id && !currentTeam.is_complete) {
        const applicantsData = await api.fetchTeamApplicationsForLeader(currentUser.id);
        // 현재 팀(teamId)에 대한 지원자만 필터링
        setApplicantsForMyTeam(applicantsData.filter(app => String(app.team_id) === teamIdStr));
      } else {
        setApplicantsForMyTeam([]);
      }
    } catch (error) {
      console.error("팀 상세 정보 또는 지원자 로드 실패:", error);
      // alert("팀 정보를 불러오는 데 실패했습니다: " + error.message);
      setTeam(null); // 에러 시 팀 정보 초기화
    } finally {
      setPageIsLoading(false);
    }
  }, [currentUser, projectId, teamIdStr]); // teamIdStr 사용

  useEffect(() => {
    loadProjectDetails();
  }, [loadProjectDetails]);

  useEffect(() => {
    if (project) { // 프로젝트 정보 로드 후 팀 정보 로드
        loadTeamDetailsAndApplicants();
    }
  }, [project, loadTeamDetailsAndApplicants]);


  const handleAcceptApplicant = async (applicant) => {
    if (!team || !currentUser || currentUser.id !== team.leader_id) return;
    setAuthIsLoading(true);
    try {
      await api.acceptTeamApplicant(team.id, applicant.applicant_info.id); // FastAPI는 teamId, student_id
      alert(`${applicant.applicant_info.name}님을 팀원으로 수락했습니다.`);
      await loadTeamDetailsAndApplicants(); // 팀 정보 및 지원자 목록 새로고침
    } catch (error) {
      alert(error.message);
    } finally {
      setAuthIsLoading(false);
    }
  };

  const handleRejectApplicant = async (applicant) => {
    if (!team || !currentUser || currentUser.id !== team.leader_id) return;
    setAuthIsLoading(true);
    try {
      await api.rejectTeamApplicant(team.id, applicant.applicant_info.id);
      alert(`${applicant.applicant_info.name}님의 지원을 거절했습니다.`);
      await loadTeamDetailsAndApplicants(); // 지원자 목록 새로고침
    } catch (error) {
      alert(error.message);
    } finally {
      setAuthIsLoading(false);
    }
  };

  const handleConfirmTeam = async () => {
    if (!team || !project || !currentUser || currentUser.id !== team.leader_id) return;
    if (window.confirm("정말로 이 팀을 확정하시겠습니까? 확정 후에는 변경할 수 없습니다.")) {
      setAuthIsLoading(true);
      try {
        await api.confirmProjectTeam(team.id);
        alert("팀이 성공적으로 확정되었습니다.");
        await loadTeamDetailsAndApplicants(); // 팀 상태 (is_complete) 새로고침
      } catch (error) {
        alert(error.message);
      } finally {
        setAuthIsLoading(false);
      }
    }
  };

  const handleLeaveTeam = async () => {
    if (!team || !currentUser || currentUser.id === team.leader_id) return; // 팀장은 탈퇴 불가
    if (window.confirm("정말로 이 팀에서 탈퇴하시겠습니까?")) {
      setAuthIsLoading(true);
      try {
        await api.leaveProjectTeam(team.id, currentUser.id);
        alert("팀에서 탈퇴했습니다. 매칭 화면으로 이동합니다.");
        navigate(`/match/${projectId}`);
      } catch (error) {
        alert(error.message);
      } finally {
        setAuthIsLoading(false);
      }
    }
  };

  const navBarStyle = {display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', marginBottom: '20px'};
  const navButtonStyle = {marginLeft: '10px', padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'};


  if (authIsLoading || pageIsLoading || !project || !team) {
      return <div className="global-loader">팀 정보를 불러오는 중...</div>;
  }

  const isCurrentUserLeader = currentUser && team && currentUser.id === team.leader_id;
  // API 응답에서 team.members는 사용자 객체 배열, 팀장은 team.leader_info로 별도 제공
  const currentTeamMemberCount = team.members ? team.members.length : 0; // FastAPI Member 테이블은 팀장도 포함하므로, API 응답 구조 확인 필요

  const renderUserCard = (user, type = "member") => {
    if (!user) return <p>{type === "leader" ? "팀장" : "팀원"} 정보 없음</p>;
    return (
      <div style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', background: '#fdfdfd', borderRadius: '5px' }}>
        <p style={{margin: '0 0 5px 0'}}><strong>이름:</strong> <span onClick={() => setSelectedUserIdForPopup(user.id)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>{user.name}</span> ({type === "leader" ? "팀장" : "팀원"})</p>
        <p style={{margin: '0 0 5px 0'}}><strong>성별:</strong> {user.gender}</p>
        <p style={{margin: '0 0 5px 0'}}><strong>연락처:</strong> {user.contact || "비공개"}</p>
        <p style={{margin: '0'}}><strong>자기소개:</strong> {user.bio ? user.bio.substring(0,70) + (user.bio.length > 70 ? "..." : "") : "없음"}</p>
      </div>
    );
  };


  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      <div style={navBarStyle}>
        <h2 style={{ fontSize: '1.5em', margin: 0 }}>{project.name} - 팀: {team.id}</h2>
        <div>
          {/* <button onClick={() => navigate('/notifications')} style={navButtonStyle}>알림</button> */}
          <button onClick={() => { logout(); navigate('/login');}} style={{...navButtonStyle, background: '#dc3545'}} disabled={authIsLoading}>로그아웃</button>
        </div>
      </div>

      {team.is_complete && <p style={{color: 'green', fontWeight: 'bold', border: '2px solid green', padding: '10px', textAlign: 'center', borderRadius: '5px', background: '#e6ffed', marginBottom: '20px'}}>✨ 이 팀은 확정되었습니다! ✨</p>}

      <div style={{ display: 'flex', flexDirection: isCurrentUserLeader && !team.is_complete ? 'row' : 'column', gap: '30px' }}>
        <div style={{ flex: isCurrentUserLeader && !team.is_complete ? 2 : 1 }}>
          <h3>팀 구성원 (현재 {currentTeamMemberCount}명 / 최대 {project.maxTeamSize}명)</h3>
          {team.leader_info && renderUserCard(team.leader_info, "leader")}
          {team.members && team.members.filter(m => m.id !== team.leader_id).map(member => renderUserCard(member, "member"))}
          {!team.leader_info && (!team.members || team.members.length === 0) && <p>팀원이 없습니다.</p>}


          <div style={{ marginTop: '30px', textAlign: 'right' }}>
            {isCurrentUserLeader && !team.is_complete && (
              <button
                onClick={handleConfirmTeam}
                disabled={authIsLoading || pageIsLoading || currentTeamMemberCount < project.minTeamSize}
                style={{ padding: '10px 20px', backgroundColor: (currentTeamMemberCount >= project.minTeamSize) ? 'green' : '#aaa', color: 'white' }}
              >
                팀 확정 (최소 {project.minTeamSize}명 필요)
              </button>
            )}
            {!isCurrentUserLeader && team.members && team.members.some(m => m.id === currentUser.id) && !team.is_complete && (
              <button onClick={handleLeaveTeam} style={{ padding: '10px 20px', backgroundColor: 'orange', color: 'white' }}>
                팀 탈퇴
              </button>
            )}
          </div>
        </div>

        {isCurrentUserLeader && !team.is_complete && (
          <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
            <h3>팀 지원자 목록 ({applicantsForMyTeam.length}명)</h3>
            {pageIsLoading && applicantsForMyTeam.length === 0 && <p>지원자 목록 로딩 중...</p>}
            {!pageIsLoading && applicantsForMyTeam.length === 0 && <p>현재 이 팀에 지원한 사용자가 없습니다.</p>}

            {applicantsForMyTeam.map(app => (
              <div key={app.application_id} style={{ border: '1px solid #f0f0f0', padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '5px' }}>
                <div>
                  <p style={{margin: '0 0 5px 0'}}><strong>이름:</strong> <span onClick={() => setSelectedUserIdForPopup(app.applicant_info.id)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>{app.applicant_info.name}</span></p>
                  <small style={{color: '#555'}}>{app.applicant_info.bio ? app.applicant_info.bio.substring(0,30) + "..." : "자기소개 없음"}</small>
                </div>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button onClick={() => handleAcceptApplicant(app)} style={{ color: 'green', border: '1px solid green', background: 'white', fontSize: '0.9em', padding: '5px 10px' }} disabled={authIsLoading || pageIsLoading} title="수락">✔ 수락</button>
                  <button onClick={() => handleRejectApplicant(app)} style={{ color: 'red', border: '1px solid red', background: 'white', fontSize: '0.9em', padding: '5px 10px' }} disabled={authIsLoading || pageIsLoading} title="거절">✖ 거절</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUserIdForPopup && (
        <MemberInfoPopup userId={selectedUserIdForPopup} onClose={() => setSelectedUserIdForPopup(null)} />
      )}
    </div>
  );
};
export default TeamInfoPage;