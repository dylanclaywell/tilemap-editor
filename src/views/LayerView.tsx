import React, { useContext, useState } from 'react'

import { Layer } from '../components/Layer/Layer'
import { EditorContext } from '../contexts/EditorContext'
import { Tool } from '../components/Tool'
import { Tools } from '../components/Tools/Tools'
import { ToolSection } from '../components/Tools/ToolSection'
import { RenameLayerModal } from '../components/Layer/RenameLayerModal'
import { LayerType } from '../types/layer'

export function LayerView() {
  const [draggedLayer, setDraggedLayer] = useState<LayerType | null>(null)
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null)
  const [
    { layers, selectedLayerId },
    { setSelectedLayerId, addLayer, updateLayerSettings },
  ] = useContext(EditorContext)

  const currentLayer = layers.find((layer) => layer.id === selectedLayerId)

  return (
    <div>
      <Tools>
        <ToolSection>
          <Tool
            onClick={() => addLayer()}
            icon="circle-plus"
            name="Add layer"
          />
        </ToolSection>
      </Tools>
      <div className="p-2 border-gray-300">
        {layers
          .sort((a, b) => (a.sortOrder > b.sortOrder ? -1 : 1))
          .map((layer) => (
            <Layer
              key={`layer-${layer.name}`}
              id={layer.id}
              sortOrder={layer.sortOrder}
              isSelected={layer.id === selectedLayerId}
              isVisible={layer.isVisible}
              name={layer.name}
              onClick={() => setSelectedLayerId(layer.id)}
              onRename={() => setRenamingLayerId(layer.id)}
              onDragStart={() => {
                setDraggedLayer(layer)
              }}
              onDragEnd={() => {
                setDraggedLayer(null)
              }}
              draggedLayer={draggedLayer}
            />
          ))}
      </div>
      <RenameLayerModal
        isOpen={Boolean(renamingLayerId)}
        onClose={() => setRenamingLayerId(null)}
        currentLayerName={currentLayer?.name ?? ''}
        onSubmit={(name) => {
          if (!renamingLayerId) return

          updateLayerSettings(renamingLayerId, { name })
          setRenamingLayerId(null)
        }}
      />
    </div>
  )
}
