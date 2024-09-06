import classTypes from '@/public/data/classTypes'
import { Badge } from '@/components/ui/badge'

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
        <div className="flex overflow-x-auto whitespace-nowrap p-2 gap-2 ">
          {classTypes[
            classTypes.findIndex(ct => ct.id === selectedClass)
          ].vocabulary.map((word, index) => (
            <Badge
              key={index}
              variant={`${saidWords.includes(word) ? 'default' : 'secondary'}`}
            >
              {word}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default VocabularyList
