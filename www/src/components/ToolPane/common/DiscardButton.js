import React from 'react';

const DiscardButton = props => (
    <div style={{display: 'flex', justifyContent: 'space-around'}}>
      <button className='primary-btn discard-btn' onClick={props.onDiscard}>
        <svg viewBox="0 0 20 20" width="20" height="20" transform='scale(0.8, 0.8)' pointerEvents='none'>
          <path fillRule="evenodd" fill='#FFF' d="M18.388 2L20 3.557 6.576 17.458 0 11.108 1.804 9.24l4.964 4.793L18.388 2z" />
        </svg>
      </button>
    </div>
);

export default DiscardButton
