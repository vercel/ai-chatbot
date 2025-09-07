import React from 'react';

export const Markdown = ({ children }: { children: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: children }} />;
};

export default Markdown;