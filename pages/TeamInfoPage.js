// src/pages/TeamInfoPage.js
import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext, DataContext } from '../App';
import MemberInfoPopup from '../components/Team/MemberInfoPopup';

const TeamInfoPage = () => {
  const { projectId, teamId } = useParams();
  const { currentUser, logout } = useContext(AuthContext);
  const { projects, teams, users, supports, setTeams, setSupports } = useContext(DataContext);
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [team, setTeam] = useState(null);
  const [teamLeader, setTeamLeader] = useState(null);
  const [teamMembersInfo, setTeamMembersInfo] = useState([]);
  const [applicantsToThisTeam, setApplicantsToThisTeam] = useState([]);
  const [selectedUserForPopup, setSelectedUserForPopup] = useState(null);

  useEffect(() => {
    const currentProject = projects.find(p => p.id === projectId);
    const currentTeam = teams.find(t => t.id === teamId && t.projectId === projectId);

    if (currentProject && currentTeam && currentUser) {
      setProject(currentProject);
      setTeam(currentTeam);

      const leader = users.find(u => u.id === currentTeam.leaderId);
      setTeamLeader(leader);

      const members = currentTeam.members.map(memberId => users.find(u => u.id === memberId)).filter(Boolean);
      setTeamMembersInfo(members);

      // 팀장인 경우, 이 팀에 지원한 사용자 목록 가져오기
      if (currentUser.id === currentTeam.leaderId) {
        const applicants = supports
          .filter(s => s.teamId === teamId && s.projectId === projectId)
          .map(s => {
              const applicantUser = users.find(u => u.id === s.userId);
              return applicantUser ? {...applicantUser, supportId: s.id } : null; // 지원 ID도 함께 저장
          })
          .filter(Boolean);
        setApplicantsToThisTeam(applicants);
      }

      // 현재 유저가 이 팀의 멤버이거나 리더인지 확인 (접근 권한)
      const isUserAuthorized = currentTeam.leaderId === currentUser.id || currentTeam.members.includes(currentUser.id);
      if (!isUserAuthorized) {
          alert("해당 팀에 소속되어 있지 않아 접근할 수 없습니다.");
          navigate(`/match/${projectId}`); // 혹은 메인 페이지로
      }

    } else {
      alert("프로젝트 또는 팀 정보를 찾을 수 없거나, 사용자 정보가 없습니다.");
      navigate('/main');
    }
  }, [projectId, teamId, projects, teams, users, supports, currentUser, navigate]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isCurrentUserLeader = team && currentUser && team.leaderId === currentUser.id;
  const currentTeamSize = (teamLeader ? 1 : 0) + teamMembersInfo.length;

  const handleAcceptApplicant = (applicant) => {
    if (!project || !team) return;
    if (currentTeamSize >= project.maxTeamSize) {
      alert("팀이 이미 최대 인원입니다. 더 이상 팀원을 추가할 수 없습니다.");
      return;
    }
    // 팀원 목록에 추가
    setTeams(prevTeams => prevTeams.map(t =>
      t.id === teamId ? { ...t, members: [...t.members, applicant.id] } : t
    ));
    // 지원 목록에서 해당 지원자 제거 (supportId 사용)
    setSupports(prevSupports => prevSupports.filter(s => s.id !== applicant.supportId));
    alert(`${applicant.name}님을 팀원으로 추가했습니다.`);
  };

  const handleRejectApplicant = (applicant) => {
    // 지원 목록에서 해당 지원자 제거
    setSupports(prevSupports => prevSupports.filter(s => s.id !== applicant.supportId));
    alert(`${applicant.name}님의 지원을 거절했습니다.`);
  };

  const handleConfirmTeam = () => {
    if (!project || !team) return;
    if (currentTeamSize < project.minTeamSize) {
      alert(`팀 확정을 위해서는 최소 ${project.minTeamSize}명의 팀원(팀장 포함)이 필요합니다. 현재 ${currentTeamSize}명입니다.`);
      return;
    }
    if (window.confirm("정말로 이 팀을 확정하시겠습니까? 확정 후에는 팀원 변경 및 추가 지원자 받기가 불가능해집니다.")) {
      setTeams(prevTeams => prevTeams.map(t =>
        t.id === teamId ? { ...t, isComplete: true } : t
      ));
      alert("팀이 성공적으로 확정되었습니다.");
    }
  };

  const handleLeaveTeam = () => {
    if (!currentUser || isCurrentUserLeader || !team || team.isComplete) {
      alert("팀장이거나 이미 확정된 팀에서는 탈퇴할 수 없습니다.");
      return;
    }
    if (window.confirm("정말로 이 팀에서 탈퇴하시겠습니까?")) {
      setTeams(prevTeams => prevTeams.map(t =>
        t.id === teamId ? { ...t, members: t.members.filter(memberId => memberId !== currentUser.id) } : t
      ));
      alert("팀에서 탈퇴했습니다. 매칭 화면으로 돌아갑니다.");
      navigate(`/match/${projectId}`);
    }
  };

  const renderUserInfo = (user) => (
    user ? (
      <div style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', background: '#fdfdfd' }}>
        <p><strong>이름:</strong> <span onClick={() => setSelectedUserForPopup(user)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>{user.name}</span></p>
        <p><strong>성별:</strong> {user.gender}</p>
        <p><strong>연락처:</strong> {user.contact}</p>
        <p><strong>자기소개:</strong> {user.bio ? user.bio.substring(0,50) + (user.bio.length > 50 ? "..." : "") : "없음"}</p>
      </div>
    ) : <p>정보 없음</p>
  );

  if (!project || !team || !currentUser) return <p>로딩 중...</p>;
  const commonNavbarStyle = { /* ... MainPage와 동일 ... */ };
  const navButtonStyle = { /* ... MainPage와 동일 ... */ };

  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      {/* Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', marginBottom: '20px' }}>
         <h1 style={{ fontSize: '1.8em', margin: 0 }}>팀 정보: {project.name} (팀 ID: {team.id})</h1>
        <div>
          {/* <button onClick={() => navigate('/notifications')} style={navButtonStyle}>알림</button> */}
          <button onClick={handleLogout} style={{ marginLeft: '10px', padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>로그아웃</button>
        </div>
      </div>


      {team.isComplete && <p style={{ color: 'green', fontWeight: 'bold', border: '2px solid green', padding: '10px', textAlign: 'center', borderRadius: '5px', background: '#e6ffed', marginBottom: '20px'}}>✨ 이 팀은 확정되었습니다! ✨</p>}

      <div style={{ display: 'flex', flexDirection: isCurrentUserLeader && !team.isComplete ? 'row' : 'column', gap: '30px' }}>
        <div style={{ flex: isCurrentUserLeader && !team.isComplete ? 2 : 'auto' }}>
          <h3>팀장</h3>
          {renderUserInfo(teamLeader)}

          <h3>팀원 (현재 {teamMembersInfo.length}명, 총 {currentTeamSize}/{project.maxTeamSize}명)</h3>
          {teamMembersInfo.length > 0 ? teamMembersInfo.map(member => renderUserInfo(member)) : <p>아직 팀원이 없습니다.</p>}

          <div style={{ marginTop: '30px', textAlign: 'right' }}>
            {isCurrentUserLeader && !team.isComplete && (
              <button
                onClick={handleConfirmTeam}
                disabled={currentTeamSize < project.minTeamSize || team.isComplete}
                style={{ padding: '10px 20px', backgroundColor: (currentTeamSize >= project.minTeamSize && !team.isComplete) ? 'green' : '#aaa', color: 'white', border: 'none', borderRadius: '4px', cursor: (currentTeamSize >= project.minTeamSize && !team.isComplete) ? 'pointer' : 'not-allowed' }}
              >
                팀 확정 (최소 {project.minTeamSize}명 필요)
              </button>
            )}
            {!isCurrentUserLeader && !team.isComplete && (
              <button onClick={handleLeaveTeam} style={{ padding: '10px 20px', backgroundColor: 'orange', color: 'white', border: 'none', borderRadius: '4px' }}>
                팀 탈퇴
              </button>
            )}
          </div>
        </div>

        {isCurrentUserLeader && !team.isComplete && (
          <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
            <h3>팀 지원자 목록 ({applicantsToThisTeam.length}명)</h3>
            {applicantsToThisTeam.length > 0 ? (
              applicantsToThisTeam.map(applicant => (
                <div key={applicant.id} style={{ border: '1px solid #f0f0f0', padding: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                  <div>
                    <p style={{margin: '0 0 5px 0'}}><strong>이름:</strong> <span onClick={() => setSelectedUserForPopup(applicant)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>{applicant.name}</span></p>
                     <small style={{color: '#555'}}>{applicant.bio ? applicant.bio.substring(0,30) + "..." : "자기소개 없음"}</small>
                  </div>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <button onClick={() => handleAcceptApplicant(applicant)} style={{ color: 'green', border: 'none', background: 'none', fontSize: '1.4em', cursor: 'pointer', padding: '5px' }} title="수락">✔</button>
                    <button onClick={() => handleRejectApplicant(applicant)} style={{ color: 'red', border: 'none', background: 'none', fontSize: '1.4em', cursor: 'pointer', padding: '5px' }} title="거절">✖</button>
                  </div>
                </div>
              ))
            ) : <p>현재 이 팀에 지원한 사용자가 없습니다.</p>}
          </div>
        )}
      </div>

      {selectedUserForPopup && (
        <MemberInfoPopup user={selectedUserForPopup} onClose={() => setSelectedUserForPopup(null)} />
      )}
    </div>
  );
};

export default TeamInfoPage;