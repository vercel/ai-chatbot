import classTypes from '@/public/data/classTypes'

const VocabularyList = ({
  selectedClass,
  saidWords
}: {
  selectedClass: string
  saidWords: string[]
}) => {
  return (
    <div>
      {classTypes[classTypes.findIndex(ct => ct.id === selectedClass)]
        ?.vocabulary?.length > 0 ? (
        <div
          style={{
            display: 'flex', // Flexbox layout for horizontal alignment
            padding: 0, // Remove default padding
            margin: 0, // Remove default margin
            gap: '20px' // Space between items (use marginRight if not using gap)
          }}
        >
          {classTypes[
            classTypes.findIndex(ct => ct.id === selectedClass)
          ].vocabulary.map((word, index) => (
            <span
              key={index}
              // style so that the word is barely readable if not said
              // and animate when the user said it
              style={{
                padding: '8px',
                borderRadius: '20px',
                backgroundColor: saidWords.includes(word)
                  ? '#DCF8C6'
                  : '#E5E5EA',
                color: saidWords.includes(word) ? '#000' : '#fff',
                transition: 'background-color 0.5s ease-in-out',
                cursor: 'pointer'
              }}
            >
              {word}
            </span> // Using <div> for each word
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default VocabularyList
