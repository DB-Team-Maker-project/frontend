// src/components/Team/MemberInfoPopup.js
import React from 'react';

const MemberInfoPopup = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div style={{
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', padding: '25px', borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)', minWidth: '300px', maxWidth: '500px',
        position: 'relative' // X 버튼을 위한 relative position
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
        <p><strong>이름:</strong> {user.name}</p>
        <p><strong>성별:</strong> {user.gender}</p>
        <p><strong>자기소개:</strong></p>
        <p style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: '10px', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
          {user.bio || "작성된 자기소개가 없습니다."}
        </p>
      </div>
    </div>
  );
};

export default MemberInfoPopup;