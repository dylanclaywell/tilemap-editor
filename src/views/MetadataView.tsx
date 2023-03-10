import React, { useContext, useMemo } from 'react'

import { LayerView } from './LayerView'
import { TilesetView } from './TilesetView'
import { EditorContext } from '../contexts/EditorContext'
import { ObjectView } from './ObjectView'

export function MetadataView() {
  const [{ selectedLayerId, selectedFileId, files }] = useContext(EditorContext)

  const selectedFile = useMemo(
    () => files.find((file) => file.id === selectedFileId),
    [selectedLayerId, selectedFileId]
  )
  const selectedLayer = useMemo(() => {
    return selectedFile?.layers.find((layer) => layer.id === selectedLayerId)
  }, [selectedLayerId, selectedFile])

  return (
    <div className="overflow-hidden flex flex-col basis-[20vw] divide-y border-gray-600">
      <LayerView />
      {selectedLayer?.type === 'tilelayer' ? <TilesetView /> : <ObjectView />}
    </div>
  )
}
