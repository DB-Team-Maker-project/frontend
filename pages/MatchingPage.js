// src/pages/MatchingPage.js
import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext, DataContext } from '../App';
import MemberInfoPopup from '../components/Team/MemberInfoPopup';

const MatchingPage = () => {
  const { projectId } = useParams();
  const { currentUser, logout } = useContext(AuthContext);
  const { projects, teams, users, supports, participants, setTeams, setSupports } = useContext(DataContext);
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]); // 미완성 팀들
  const [selectedUserForPopup, setSelectedUserForPopup] = useState(null);

  useEffect(() => {
    const currentProject = projects.find(p => p.id === projectId);
    if (currentProject) {
      setProject(currentProject);
      const filteredTeams = teams.filter(t => t.projectId === projectId && !t.isComplete);
      setAvailableTeams(filteredTeams);
    } else {
      alert("프로젝트 정보를 찾을 수 없습니다.");
      navigate('/main');
    }
  }, [projectId, projects, teams]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleTeamApply = (teamId) => {
    if (!project || !currentUser) return;

    const teamToApply = teams.find(t => t.id === teamId);
    if (!teamToApply) {
        alert("팀 정보를 찾을 수 없습니다.");
        return;
    }

    const currentTeamSize = (teamToApply.leaderId ? 1 : 0) + teamToApply.members.length;
    if (currentTeamSize >= project.maxTeamSize) {
      alert("팀 인원이 이미 최대입니다. 이 팀에는 신청할 수 없습니다.");
      return;
    }

    const alreadyApplied = supports.some(s => s.userId === currentUser.id && s.teamId === teamId && s.projectId === projectId);
    if (alreadyApplied) {
      alert("이미 해당 팀에 지원한 상태입니다.");
      return;
    }

    setSupports(prevSupports => [...prevSupports, { id: `sup${Date.now()}`, userId: currentUser.id, teamId, projectId }]);
    alert("팀에 성공적으로 지원했습니다.");
  };

  const handleCreateTeam = () => {
    if (!project || !currentUser) return;

    // 팀 개설 조건: (프로젝트A 참가 인원수 / 프로젝트A 최소 인원수) < 프로젝트A 팀장 수 (즉, 팀 수가 부족할 때만 개설 가능)
    // 요청: "(참가인원수/최소인원수) 가 팀장수와 같거나 클 때 개설 불가"
    const projectParticipantsCount = participants.filter(p => p.projectId === projectId).length;
    const projectTeamsForThisProject = teams.filter(t => t.projectId === projectId);
    const projectLeaderCount = projectTeamsForThisProject.length; // 현재 이 프로젝트의 팀 수 (각 팀에 리더 1명)

    // 최소 팀 인원수가 0보다 커야 나눗셈 가능
    if (project.minTeamSize > 0) {
        if (projectParticipantsCount / project.minTeamSize >= projectLeaderCount && projectLeaderCount > 0) {
            // 이 조건은 팀 수가 충분하거나 너무 많을 때 팀 개설을 막기 위함으로 해석
            alert("현재 조건에서는 더 이상 팀을 개설할 수 없습니다. (참가 인원 대비 팀 수 제한)");
            return;
        }
    } else if (projectLeaderCount > 0 && projectParticipantsCount < 1) { // 최소 팀원수가 0 또는 미설정이고, 참가자가 없는데 팀이 이미 있다면
        alert("팀 개설을 위한 최소 요건을 확인해주세요.");
        return;
    }


    // 현재 유저가 이미 이 프로젝트의 다른 팀 리더이거나 멤버인지 확인
    const existingTeamAffiliation = teams.find(t => t.projectId === projectId && (t.leaderId === currentUser.id || t.members.includes(currentUser.id)));
    if (existingTeamAffiliation) {
        alert("이미 이 프로젝트의 다른 팀에 소속되어 있거나 팀장입니다. 새로운 팀을 개설할 수 없습니다.");
        return;
    }


    const newTeam = {
      id: `team${Date.now()}`,
      projectId: projectId,
      leaderId: currentUser.id,
      members: [], // 초기 멤버는 없음
      isComplete: false
    };
    setTeams(prevTeams => [...prevTeams, newTeam]);
    alert("새로운 팀이 개설되었습니다. 팀 정보 확인 화면으로 이동합니다.");
    navigate(`/team/${projectId}/${newTeam.id}`);
  };

  const commonNavbarStyle = { /* ... MainPage와 동일 ... */ };
  const navButtonStyle = { /* ... MainPage와 동일 ... */ };


  if (!project || !currentUser) return <p>로딩 중...</p>;

  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      {/* Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.8em', margin: 0 }}>{project.name} - 팀 매칭</h1>
        <div>
          {/* <button onClick={() => navigate('/notifications')} style={navButtonStyle}>알림</button> */}
          <button onClick={handleLogout} style={{ marginLeft: '10px', padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>로그아웃</button>
        </div>
      </div>


      <h3 style={{marginBottom: '20px'}}>참여 가능한 팀 목록 (미완성 팀)</h3>
      {availableTeams.length === 0 ? (
        <p>현재 참여 가능한 팀이 없습니다. 새로운 팀을 개설해보세요!</p>
      ) : (
        availableTeams.map(team => {
          const leader = users.find(u => u.id === team.leaderId);
          const memberDetails = team.members.map(memberId => users.find(u => u.id === memberId)).filter(Boolean);
          const isAlreadyApplied = supports.some(s => s.userId === currentUser.id && s.teamId === team.id && s.projectId === projectId);
          const currentTeamSize = (leader ? 1 : 0) + memberDetails.length;

          return (
            <div key={team.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
              <h4>팀 ID: {team.id} (현재 {currentTeamSize}/{project.maxTeamSize}명)</h4>
              {leader && (
                <p><strong>팀장:</strong> <span onClick={() => setSelectedUserForPopup(leader)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>{leader.name}</span></p>
              )}
              <p><strong>팀원:</strong></p>
              {memberDetails.length > 0 ? (
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {memberDetails.map(member => (
                    <li key={member.id}>
                      <span onClick={() => setSelectedUserForPopup(member)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>{member.name}</span>
                    </li>
                  ))}
                </ul>
              ) : <p style={{ marginLeft: '20px' }}>아직 팀원이 없습니다.</p>}

              <div style={{ marginTop: '10px' }}>
                {isAlreadyApplied ? (
                  <span style={{ color: 'green', fontWeight: 'bold' }}>신청됨</span>
                ) : (
                  <button onClick={() => handleTeamApply(team.id)} disabled={currentTeamSize >= project.maxTeamSize} style={{padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: currentTeamSize >= project.maxTeamSize ? 'not-allowed' : 'pointer' }}>
                    {currentTeamSize >= project.maxTeamSize ? "인원 마감" : "이 팀에 신청"}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      <div style={{ position: 'fixed', bottom: '30px', right: '30px' }}>
        <button onClick={handleCreateTeam} style={{ padding: '12px 20px', backgroundColor: 'darkseagreen', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1em', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', cursor: 'pointer' }}>
          + 새로운 팀 개설
        </button>
      </div>

      {selectedUserForPopup && (
        <MemberInfoPopup user={selectedUserForPopup} onClose={() => setSelectedUserForPopup(null)} />
      )}
    </div>
  );
};

export default MatchingPage;