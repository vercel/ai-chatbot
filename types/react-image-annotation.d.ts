declare module 'react-image-annotation' {
  interface AnnotationData {
    geometry: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    data: {
      id?: number;
      text?: string;
    };
  }

  interface AnnotationProps {
    src: string;
    alt?: string;
    annotations: AnnotationData[];
    value: Partial<AnnotationData>;
    onChange: (annotation: Partial<AnnotationData>) => void;
    onSubmit: (annotation: AnnotationData) => void;
  }

  const Annotation: React.ComponentType<AnnotationProps>;
  export default Annotation;
}