import classTypes from '@/public/data/classTypes'
import { Badge } from '@/components/ui/badge'

const VocabularyList = ({
  selectedClass,
  saidWords
}: {
  selectedClass: string
  saidWords: string[]
}) => {
  const vocabulary =
    classTypes[classTypes.findIndex(ct => ct.id === selectedClass)]
      ?.vocabulary || []
  // Filter out the saidWords and concatenate them at the end
  const filteredVocabulary = vocabulary.filter(
    word => !saidWords.includes(word)
  )
  const updatedVocabulary = [...filteredVocabulary, ...saidWords]

  return (
    <div>
      {updatedVocabulary.length > 0 ? (
        <div className="flex overflow-x-auto whitespace-nowrap p-2 gap-2">
          {updatedVocabulary.map((word, index) => (
            <Badge
              key={index}
              variant={`${saidWords.includes(word) ? 'default' : 'secondary'}`}
            >
              {word}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="flex overflow-x-auto whitespace-nowrap p-2 gap-2 ">
          <span className="text-gray-500">No vocabulary for this lesson</span>
        </div>
      )}
    </div>
  )
}

export default VocabularyList
