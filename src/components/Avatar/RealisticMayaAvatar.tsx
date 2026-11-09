/**
 * AYRA AI — Avatar System Re-export Bridge
 * Maintains backward compatibility while directing all avatar rendering to the
 * clean extracted AyraRiggedAvatar with real viseme lip-sync and 3D pose rigging.
 * @license Apache-2.0
 */

import React from 'react';
import { AyraRiggedAvatar, AyraRiggedAvatarProps } from './AyraRiggedAvatar';

export { AyraRiggedAvatar };
export type { AyraRiggedAvatarProps };

// Compatibility alias for existing references
export const RealisticMayaAvatar: React.FC<AyraRiggedAvatarProps> = (props) => {
  return <AyraRiggedAvatar {...props} />;
};

export default AyraRiggedAvatar;
