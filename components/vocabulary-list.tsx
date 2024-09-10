import classTypes from '@/public/data/classTypes'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

const VocabularyList = ({
  selectedClass,
  saidWords,
  playText
}: {
  selectedClass: string
  saidWords: string[]
  playText: ({ text }: { text: string }) => void
}) => {
  const vocabulary =
    classTypes[classTypes.findIndex(ct => ct.id === selectedClass)]
      ?.vocabulary || []
  // Filter out the saidWords and concatenate them at the end
  const filteredVocabulary = vocabulary.filter(
    word => !saidWords.includes(word)
  )
  const updatedVocabulary = [...filteredVocabulary, ...saidWords]
  const selectedClassType = classTypes.find(ct => ct.id === selectedClass)
  const vocabularyDefinitions = selectedClassType?.vocabularyDefinitions || []
  return (
    <div>
      {updatedVocabulary.length > 0 ? (
        <div className="flex overflow-x-auto whitespace-nowrap p-2 gap-2">
          {updatedVocabulary.map((word, index) => {
            // Find the corresponding definition if it exists
            const definitionIndex = vocabulary.findIndex(v => v === word)

            const definition =
              definitionIndex !== -1
                ? vocabularyDefinitions[definitionIndex]
                : null

            return (
              <Tooltip key={index}>
                <TooltipTrigger>
                  <Badge
                    variant={`${saidWords.includes(word) ? 'default' : 'secondary'}`}
                    onClick={() =>
                      playText({
                        text: definition
                          ? `The word ${word} means ${definition}`
                          : `Repeat after me: ${word}`
                      })
                    }
                  >
                    {word}
                  </Badge>
                </TooltipTrigger>
                {definition && (
                  <TooltipContent>
                    <p>{definition}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
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
