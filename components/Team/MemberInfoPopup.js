// src/components/Team/MemberInfoPopup.js
import React, { useState, useEffect } from 'react';
import * as api from '../../services/api'; // 사용자 상세 정보 API 호출 위해

const MemberInfoPopup = ({ userId, onClose }) => { // user 객체 대신 userId를 받도록 수정 (API 호출)
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await api.fetchUserDetails(userId); // API 호출
        setUserData(data); // API 응답에는 bio, contact 등이 포함 (api.js에서 매핑)
      } catch (err) {
        console.error("사용자 정보 로드 실패:", err);
        setError(err.message || "사용자 정보를 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (!userId) return null; // userId 없으면 팝업 안띄움

  return (
    <div style={{ /* 이전과 동일한 팝업 스타일 */
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', padding: '25px', borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)', minWidth: '300px', maxWidth: '500px',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '10px', right: '10px', background: 'transparent',
          border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: '1'
        }}>
          &times;
        </button>
        <h3 style={{ marginTop: '0', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
          회원 정보
        </h3>
        {isLoading && <p>정보 로딩 중...</p>}
        {error && <p style={{color: 'red'}}>{error}</p>}
        {userData && !isLoading && !error && (
          <>
            <p><strong>학번:</strong> {userData.student_id}</p>
            <p><strong>이름:</strong> {userData.name}</p>
            <p><strong>성별:</strong> {userData.gender}</p>
            <p><strong>연락처:</strong> {userData.contact}</p> {/* FastAPI는 phone_number, api.js에서 contact로 매핑 */}
            <p><strong>사용 언어:</strong> {userData.languages}</p>
            <p><strong>MBTI:</strong> {userData.mbti}</p>
            <p><strong>경력:</strong> {userData.career}</p>
            <p><strong>자기소개:</strong></p>
            <p style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: '10px', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
              {userData.bio || "작성된 자기소개가 없습니다."} {/* FastAPI는 intro, api.js에서 bio로 매핑 */}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default MemberInfoPopup;