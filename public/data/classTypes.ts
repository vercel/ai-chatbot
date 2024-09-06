const classTypes: {
  id: string
  name: string
  vocabulary: string[]
  description: string
}[] = [
  {
    id: '1',
    name: 'Identify important people and places in a hospital',
    vocabulary: [
      'medical',
      'doctor (Dr.)',
      'nurse',
      'Intensive Care Unit (ICU)',
      'ward',
      'surgeon',
      'operating room (OR)',
      'emergency department (ED)'
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
  }
]

export default classTypes
