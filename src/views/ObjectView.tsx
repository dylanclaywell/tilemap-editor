import React, { useContext, useState } from 'react'
import z from 'zod'

import { EditorContext } from '../contexts/EditorContext'
import { ResourceList } from '../components/ResourceList/ResourceList'
import { ResourceListItem } from '../components/ResourceList/ResourceListItem'
import { ObjectType } from '../types/object'
import { Properties } from '../components/Object/Properties'

export function ObjectView() {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [
    { selectedLayerId, selectedFileId, files },
    { updateObjectSettings, removeObject },
  ] = useContext(EditorContext)
  const [draggedObject, setDraggedObject] = useState<ObjectType | null>(null)
  const [renamingObjectId, setRenamingObjectId] = useState<string | null>(null)

  const currentFile = files.find((file) => file.id === selectedFileId)
  const currentLayer = currentFile?.layers.find(
    (layer) => layer.id === selectedLayerId
  )

  if (!currentLayer || currentLayer.type !== 'objectlayer') return null

  const selectedObject = currentLayer.data.find(
    (object) => object.id === selectedObjectId
  )

  const objects = currentLayer.data

  return (
    <div className="flex flex-col basis-[30vw] border-gray-600 flex-grow">
      <div className="basis-1/2 flex-1 overflow-y-auto">
        <h1 className="m-2 mb-0 text-xl text-gray-400">Objects</h1>
        <ResourceList>
          {objects
            .sort((a, b) => (a.sortOrder > b.sortOrder ? 1 : -1))
            .map((object) => (
              <ResourceListItem
                key={`object-${object.id}`}
                id={object.id}
                sortOrder={object.sortOrder}
                isSelected={object.id === selectedObjectId}
                isVisible={object.isVisible}
                name={object.name}
                onClick={() => {
                  setSelectedObjectId(object.id)
                }}
                onRename={() => setRenamingObjectId(object.id)}
                onDragStart={() => {
                  setDraggedObject(object)
                }}
                onDragEnd={() => {
                  setDraggedObject(null)
                }}
                onDrop={(event) => {
                  event.preventDefault()

                  if (!draggedObject) return
                  if (draggedObject?.id === object.id) return

                  updateObjectSettings(currentLayer.id, draggedObject.id, {
                    sortOrder: object.sortOrder,
                  })
                  updateObjectSettings(currentLayer.id, object.id, {
                    sortOrder: draggedObject.sortOrder,
                  })
                }}
                onHide={() =>
                  updateObjectSettings(currentLayer.id, object.id, {
                    isVisible: !object.isVisible,
                  })
                }
                onDelete={() => removeObject(currentLayer.id, object.id)}
                draggedId={draggedObject?.id ?? null}
              />
            ))}
        </ResourceList>
      </div>
      {selectedObject && <Properties object={selectedObject} />}
    </div>
  )
}
