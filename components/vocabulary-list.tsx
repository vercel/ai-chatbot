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
            overflowX: 'auto' /* Allow horizontal scrolling */,
            whiteSpace: 'nowrap', // Remove default margin
            padding: '8px',
            gap: '10px' // Space between items (use marginRight if not using gap)
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
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                color: saidWords.includes(word) ? '#DCF8C6' : '#E5E5EA',
                backgroundColor: saidWords.includes(word) ? '#000' : '#fff',
                transition: 'background-color 0.5s ease-in-out'
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
