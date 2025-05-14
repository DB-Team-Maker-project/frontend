// src/pages/ProjectEditPage.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext, DataContext } from '../App';
import * as api from '../services/api'; // 직접 API 호출할 경우

const ProjectEditPage = ({ mode }) => {
  const { isLoading, setIsLoading } = useContext(AuthContext); // setIsLoading 직접 사용
  const { projects, handleAddProject, handleUpdateProject } = useContext(DataContext);
  const navigate = useNavigate();
  const { projectId } = useParams(); // 'edit' 모드일 때 URL에서 projectId (문자열)

  const [formData, setFormData] = useState({
    name: '', organizer: '', applicationDeadline: '', matchingStart: '',
    matchingEnd: '', minTeamSize: '', maxTeamSize: ''
  });

  useEffect(() => {
    if (mode === 'edit' && projectId) {
      const projectToEdit = projects.find(p => p.id === projectId); // projects는 이미 로드된 상태 가정
      if (projectToEdit) {
        setFormData({ // API 응답 필드명과 React 상태 필드명 일치시킴 (api.js 또는 App.js에서 매핑)
            name: projectToEdit.name,
            organizer: projectToEdit.organizer,
            applicationDeadline: projectToEdit.applicationDeadline,
            matchingStart: projectToEdit.matchingStart,
            matchingEnd: projectToEdit.matchingEnd,
            minTeamSize: String(projectToEdit.minTeamSize),
            maxTeamSize: String(projectToEdit.maxTeamSize)
        });
      } else if (projects.length > 0) { // projects 로드는 되었으나 해당 ID가 없을 때
        alert("수정할 대회 정보를 찾을 수 없습니다. 목록으로 돌아갑니다.");
        navigate('/admin');
      }
      // projects가 아직 로드되지 않았다면 로딩 상태를 보여주거나, App.js에서 DataContext를 통해 전달받도록 설계
    } else if (mode === 'new') {
        setFormData({ name: '', organizer: '', applicationDeadline: '', matchingStart: '',
                      matchingEnd: '', minTeamSize: '2', maxTeamSize: '5' }); // 새 프로젝트 시 기본값 예시
    }
  }, [mode, projectId, projects, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // 유효성 검사 (필요시)
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // 필수 입력 필드 및 유효성 검사 (기존 로직 유지 또는 강화)
    for (const key in formData) {
        if (formData[key] === '') { alert("모든 필드를 입력해주세요."); return; }
    }
    const minSize = parseInt(formData.minTeamSize);
    const maxSize = parseInt(formData.maxTeamSize);
    if (new Date(formData.matchingEnd) < new Date(formData.matchingStart)) { alert("매칭 종료일은 시작일보다 빠를 수 없습니다."); return; }
    if (new Date(formData.matchingStart) > new Date(formData.applicationDeadline)) { alert("매칭 시작일은 대회 신청 마감일보다 나중이어야 합니다."); return; } // 추가된 유효성
    if (minSize <= 0 || maxSize <= 0 || minSize > maxSize) { alert("팀 인원수를 올바르게 입력해주세요."); return; }


    const projectDataPayload = { // React 상태 -> API 페이로드 (api.js 또는 App.js에서 매핑했으므로 그대로 전달 가능)
        name: formData.name, organizer: formData.organizer, applicationDeadline: formData.applicationDeadline,
        matchingStart: formData.matchingStart, matchingEnd: formData.matchingEnd,
        minTeamSize: minSize, maxTeamSize: maxSize
    };

    let success = false;
    if (mode === 'new') {
      success = await handleAddProject(projectDataPayload);
    } else if (mode === 'edit' && projectId) {
      success = await handleUpdateProject(projectId, projectDataPayload); // projectId는 문자열, API에서는 숫자 pid로 변환 필요
    }

    if (success) {
      navigate('/admin');
    }
  };

  const inputStyle = { padding: '10px', fontSize: '1em', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', marginBottom: '10px' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold'};


  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '40px auto', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>
        {mode === 'new' ? '새 대회 추가' : '대회 정보 수정'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div><label style={labelStyle}>대회명:</label><input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} required disabled={isLoading}/></div>
        <div><label style={labelStyle}>개최자:</label><input type="text" name="organizer" value={formData.organizer} onChange={handleChange} style={inputStyle} required disabled={isLoading}/></div>
        <div><label style={labelStyle}>대회 신청 마감일:</label><input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange} style={inputStyle} required disabled={isLoading}/></div>
        <div><label style={labelStyle}>매칭 지원 시작일:</label><input type="date" name="matchingStart" value={formData.matchingStart} onChange={handleChange} style={inputStyle} required disabled={isLoading}/></div>
        <div><label style={labelStyle}>매칭 지원 종료일:</label><input type="date" name="matchingEnd" value={formData.matchingEnd} onChange={handleChange} style={inputStyle} required disabled={isLoading}/></div>
        <div><label style={labelStyle}>팀 최소 인원:</label><input type="number" name="minTeamSize" value={formData.minTeamSize} onChange={handleChange} style={inputStyle} min="1" required disabled={isLoading}/></div>
        <div><label style={labelStyle}>팀 최대 인원:</label><input type="number" name="maxTeamSize" value={formData.maxTeamSize} onChange={handleChange} style={inputStyle} min="1" required disabled={isLoading}/></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
          <button type="button" onClick={() => navigate('/admin')} style={{ padding: '10px 15px', background: '#6c757d', color: 'white' }} disabled={isLoading}>취소</button>
          <button type="submit" style={{ padding: '10px 15px', background: '#007bff', color: 'white' }} disabled={isLoading}>
            {isLoading ? (mode === 'new' ? "생성 중..." : "수정 중...") : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
};
export default ProjectEditPage;