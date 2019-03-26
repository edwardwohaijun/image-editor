import React from 'react';

export default {
  rotate_counter_clockwise: (
      <svg fill='#ccc' viewBox="0 0 20 20" width="100%" height="100%" pointerEvents='none'>
        <g fillRule="evenodd">
          <path
              d="M6.5 19.811c.645.124 1.314.189 2 .189 5.247 0 9.5-3.806 9.5-8.5S13.747 3 8.5 3c-1.83 0-3.538.463-4.988 1.265L4.809 5.84A8.374 8.374 0 0 1 8.5 5c4.142 0 7.5 2.91 7.5 6.5S12.642 18 8.5 18a8.595 8.595 0 0 1-2-.234v2.045z"/>
          <path d="M2.707 4.95L2 4.243 6.243 0l1.414 1.414-2.829 2.829L7.657 7.07 6.243 8.485 2.707 4.95z"/>
        </g>
      </svg>
  ),

  rotate_clockwise: (
    <svg fill='#ccc' viewBox="0 0 20 20" width="100%" height="100%" pointerEvents='none'>
      <g fillRule="evenodd">
        <path
            d="M13.5 19.811c-.645.124-1.314.189-2 .189C6.253 20 2 16.194 2 11.5S6.253 3 11.5 3c1.83 0 3.538.463 4.988 1.265L15.191 5.84A8.374 8.374 0 0 0 11.5 5C7.358 5 4 7.91 4 11.5S7.358 18 11.5 18c.693 0 1.363-.081 2-.234v2.045z"/>
        <path d="M17.293 4.95L18 4.243 13.757 0l-1.414 1.414 2.829 2.829-2.829 2.828 1.414 1.414 3.536-3.535z"/>
      </g>
    </svg>
),

  flip_horizontal: (
    <svg fill='#ccc' viewBox="0 0 20 20" width="100%" height="100%" pointerEvents='none'>
      <g fillRule="evenodd">
        <path d="M0 5v10l7-5z"/>
        <path fillRule="nonzero" d="M19 6l-5 4 5 4V6zm1-2.08v12.16L12.4 10 20 3.92z"/>
        <path d="M9 0h2v20H9z"/>
      </g>
    </svg>
),

  flip_vertical: (
    <svg fill='#ccc' viewBox="0 0 20 20" width="100%" height="100%" pointerEvents='none'>
      <g fillRule="evenodd">
        <path d="M5 0h10l-5 7zM0 9h20v2H0z"/>
        <path fillRule="nonzero" d="M10 13l5 7H5l5-7zm-3.373 6.163h6.746L10 14.44l-3.373 4.722z"/>
      </g>
    </svg>
  )
};
