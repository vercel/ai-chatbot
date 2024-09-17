const classTypes: {
  id: string
  name: string
  vocabulary: string[]
  vocabularyAbbreviations?: string[]
  vocabularyDefinitions?: string[]
  description: string
}[] = [
  {
    id: '1',
    name: 'Identify important people and places in a hospital',
    vocabulary: [
      'medical',
      'doctor',
      'nurse',
      'Intensive Care Unit',
      'ward',
      'surgeon',
      'operating room',
      'emergency department'
    ],
    vocabularyAbbreviations: ['', 'Dr.', '', 'ICU', '', '', 'OR', 'ED'],
    vocabularyDefinitions: [
      'relating to the science or practice of medicine',
      'a qualified practitioner of medicine; a physician',
      'a person trained to care for the sick or infirm, especially in a hospital',
      'a unit in a hospital providing intensive care for people who are seriously ill',
      'a large room in a hospital for patients needing special or continuous care',
      'a medical practitioner qualified to practice surgery',
      'a room in a hospital equipped for surgical operations',
      'a department of a hospital that provides immediate treatment for acute illnesses and injuries'
    ],
    description: 'Lesson #1: Identify important people and places in a hospital'
  },
  {
    id: '2',
    name: 'Describe safety procedures',
    vocabulary: [
      'gloves',
      'washing hands',
      'mask',
      'gown',
      'isolation',
      'to disinfect'
    ],
    description: 'Lesson #2: Describe safety procedures'
  },
  {
    id: '3',
    name: 'Communicate a patient’s vital signs with the medical team',
    vocabulary: [
      'weight',
      'temperature',
      'pulse',
      'blood pressure',
      'vital signs',
      'to measure'
    ],
    description:
      'Lesson #3: Communicate a patient’s vital signs with the medical team'
  },
  {
    id: '4',
    name: 'Ask about a patient’s medical history',
    vocabulary: [
      'medical history',
      'illness',
      'surgery',
      'habits',
      'allergy',
      'medication'
    ],
    description: 'Lesson #4: Ask about a patient’s medical history'
  },
  {
    id: '5',
    name: 'Talk to a patient after an accident',
    vocabulary: ['hurt', 'pain', 'bone', 'fracture', 'sprain', 'treatment'],
    description: 'Lesson #5: Talk to a patient after an accident'
  },
  {
    id: '6',
    name: 'Talk about health in general with no specific context',
    vocabulary: [],
    description:
      'Free lesson: Talk about health in general with no specific context'
  }
]

export default classTypes
