// src/pages/ProjectEditPage.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext, DataContext } from '../App';

const ProjectEditPage = ({ mode }) => { // mode는 App.js의 Route에서 prop으로 전달: 'new' or 'edit'
  const { currentUser } = useContext(AuthContext);
  const { projects, addProject, updateProject } = useContext(DataContext);
  const navigate = useNavigate();
  const { projectId } = useParams(); // 'edit' 모드일 때 URL에서 projectId 가져오기

  const [formData, setFormData] = useState({
    name: '',
    organizer: '',
    applicationDeadline: '',
    matchingStart: '',
    matchingEnd: '',
    minTeamSize: '',
    maxTeamSize: ''
  });

  useEffect(() => {
    if (mode === 'edit' && projectId) {
      const projectToEdit = projects.find(p => p.id === projectId);
      if (projectToEdit) {
        setFormData({
            name: projectToEdit.name,
            organizer: projectToEdit.organizer,
            applicationDeadline: projectToEdit.applicationDeadline,
            matchingStart: projectToEdit.matchingStart,
            matchingEnd: projectToEdit.matchingEnd,
            minTeamSize: String(projectToEdit.minTeamSize),
            maxTeamSize: String(projectToEdit.maxTeamSize)
        });
      } else {
        alert("수정할 프로젝트 정보를 찾을 수 없습니다.");
        navigate('/admin');
      }
    } else if (mode === 'new') { // 새 프로젝트 모드일 때 폼 초기화
        setFormData({
            name: '', organizer: '', applicationDeadline: '',
            matchingStart: '', matchingEnd: '',
            minTeamSize: '', maxTeamSize: ''
        });
    }
  }, [mode, projectId, projects, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === "minTeamSize" || name === "maxTeamSize") && !/^\d*$/.test(value) && value !== '') {
        // 숫자만 입력되도록 (음수나 소수점 미고려, 필요시 정규식 강화)
        return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 필수 입력 필드 검사
    for (const key in formData) {
        if (formData[key] === '') {
            alert("모든 필드를 입력해주세요.");
            return;
        }
    }

    const { name, organizer, applicationDeadline, matchingStart, matchingEnd, minTeamSize, maxTeamSize } = formData;
    const minSize = parseInt(minTeamSize);
    const maxSize = parseInt(maxTeamSize);

    if (new Date(matchingEnd) > new Date(applicationDeadline)) {
        alert("매칭 지원 종료일자는 대회 신청 마감일보다 나중일 수 없습니다.");
        return;
    }
    if (new Date(matchingStart) > new Date(matchingEnd)) {
        alert("매칭 지원 시작일자는 매칭 지원 종료일자보다 나중일 수 없습니다.");
        return;
    }
    if (minSize <= 0 || maxSize <= 0) {
        alert("팀 최소/최대 인원은 1 이상이어야 합니다.");
        return;
    }
    if (minSize > maxSize) {
        alert("팀 최소 인원은 최대 인원보다 클 수 없습니다.");
        return;
    }

    const projectDataPayload = {
        name,
        organizer,
        applicationDeadline,
        matchingStart,
        matchingEnd,
        minTeamSize: minSize,
        maxTeamSize: maxSize
    };

    if (mode === 'new') {
      addProject(projectDataPayload);
    } else if (mode === 'edit' && projectId) {
      updateProject({ ...projectDataPayload, id: projectId });
    }
    navigate('/admin');
  };

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '40px auto', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>
        {mode === 'new' ? '새 프로젝트 추가' : '프로젝트 정보 수정'}
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label>프로젝트명: <input type="text" name="name" placeholder="프로젝트명" value={formData.name} onChange={handleChange} required style={{width: '100%', padding: '8px', boxSizing: 'border-box'}}/></label>
        <label>개최자: <input type="text" name="organizer" placeholder="개최자" value={formData.organizer} onChange={handleChange} required style={{width: '100%', padding: '8px', boxSizing: 'border-box'}}/></label>
        <label>대회 신청 마감일: <input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange} required style={{width: '100%', padding: '8px', boxSizing: 'border-box'}}/></label>
        <label>매칭 지원 시작일: <input type="date" name="matchingStart" value={formData.matchingStart} onChange={handleChange} required style={{width: '100%', padding: '8px', boxSizing: 'border-box'}}/></label>
        <label>매칭 지원 종료일: <input type="date" name="matchingEnd" value={formData.matchingEnd} onChange={handleChange} required style={{width: '100%', padding: '8px', boxSizing: 'border-box'}}/></label>
        <label>팀 최소 인원: <input type="number" name="minTeamSize" placeholder="숫자 입력" value={formData.minTeamSize} onChange={handleChange} min="1" required style={{width: '100%', padding: '8px', boxSizing: 'border-box'}}/></label>
        <label>팀 최대 인원: <input type="number" name="maxTeamSize" placeholder="숫자 입력" value={formData.maxTeamSize} onChange={handleChange} min="1" required style={{width: '100%', padding: '8px', boxSizing: 'border-box'}}/></label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" onClick={() => navigate('/admin')} style={{ padding: '10px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>취소</button>
          <button type="submit" style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>저장</button>
        </div>
      </form>
    </div>
  );
};

export default ProjectEditPage;