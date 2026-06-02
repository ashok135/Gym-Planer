import React from 'react';
import { HelpCircle } from 'lucide-react';

export const CategoryIcon = ({ cat, size = 16, style = {} }) => {
  if (!cat) return <HelpCircle size={size} style={style} />;
  if (cat.Icon) {
    const IconComponent = cat.Icon;
    return <IconComponent size={size} style={style} />;
  }
  if (cat.emoji) {
    return <span style={{ fontSize: `${size}px`, lineHeight: 1, ...style }}>{cat.emoji}</span>;
  }
  return <HelpCircle size={size} style={style} />;
};
