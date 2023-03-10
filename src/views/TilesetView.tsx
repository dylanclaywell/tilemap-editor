import React, { useContext, useState, useEffect } from 'react'

import { TilesetUploader } from '../components/TilesetUploader'
import {
  TilesetType,
  changeTilesetName,
  getTilesets,
} from '../indexedDB/tileset'
import { EditorContext } from '../contexts/EditorContext'
import { Tool } from '../components/Tool'
import { SelectField } from '../components/SelectField'
import { ToolSection } from '../components/Tools/ToolSection'
import { Tools } from '../components/Tools/Tools'
import { TilesetSettingsModal } from '../components/TilesetSettingsModal'

function TilesetViewBase({
  updateToolCanvas,
  layerType,
}: {
  updateToolCanvas: (canvas: {
    canvas: HTMLCanvasElement
    tilesetX: number
    tilesetY: number
    tilesetName: string
  }) => void
  layerType: 'tilelayer' | 'objectlayer'
}) {
  const [tilesetSettingsIsOpen, setTilesetSettingsIsOpen] = useState(false)
  const [tilesets, setTilesets] = useState<TilesetType[]>([])
  const [cursorRef, setCursorRef] = useState<HTMLDivElement | null>(null)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const [selectedTilesetId, setSelectedTilesetId] = useState<string | null>(
    null
  )

  async function refreshTilesets() {
    const tilesets = await getTilesets()
    setTilesets(tilesets)
    setSelectedTilesetId(tilesets[0]?.id ?? null)
  }

  useEffect(function loadTilesets() {
    refreshTilesets()
  }, [])

  useEffect(function registerEventListeners() {
    function handleMouseMove(event: MouseEvent) {
      if (
        !(event.target instanceof HTMLImageElement) ||
        event.target.id !== 'tileset'
      )
        return

      if (!cursorRef) return

      const area = cursorRef.querySelector('area')

      if (!area) return

      const x = Math.floor(event.offsetX / 32) * 32
      const y = Math.floor(event.offsetY / 32) * 32

      cursorRef.style.top = `${y}px`
      cursorRef.style.left = `${x}px`

      area.coords = `${x},${y},${x + 32},${y + 32}`
    }

    document.addEventListener('mousemove', handleMouseMove)

    return function cleanup() {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  })

  async function handleAreaClick(
    e: React.MouseEvent<HTMLAreaElement, MouseEvent>
  ) {
    e.preventDefault()

    if (layerType === 'objectlayer') {
      return
    }

    if (!(e.target instanceof HTMLAreaElement) || !imageRef) return

    const coords = e.target.coords
    const [x1, y1, x2, y2] = coords.split(',').map((n) => parseInt(n))
    const tilesetX = x1 / 32
    const tilesetY = y1 / 32
    const tilesetName = e.target?.dataset?.['tilesetName'] ?? 'unknown'

    const width = x2 - x1
    const height = y2 - y1

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    context?.drawImage(imageRef, x1, y1, width, height, 0, 0, width, height)
    updateToolCanvas({ canvas, tilesetX, tilesetY, tilesetName })
  }

  const currentTileset = tilesets.find(
    (tileset) => tileset.id === selectedTilesetId
  )

  return (
    <div className="h-0 flex flex-col flex-1 border-gray-600">
      <Tools>
        <ToolSection>
          <SelectField
            options={tilesets.map((tileset) => ({
              value: tileset.id,
              label: tileset.name,
            }))}
            onChange={(value) => {
              setSelectedTilesetId(value)
            }}
            value={selectedTilesetId ?? ''}
            inputProps={{
              className: 'w-full',
            }}
          />
        </ToolSection>
        <ToolSection>
          <TilesetUploader
            refreshTilesets={refreshTilesets}
            label={
              <div className="w-10 h-10 cursor-default hover:bg-gray-200 hover:border hover:border-gray-300 rounded-md flex justify-center items-center">
                <i className="fa-solid fa-file-circle-plus"></i>
              </div>
            }
          />
        </ToolSection>
        <ToolSection>
          <Tool
            icon="trash-can"
            name="Delete tileset"
            onClick={() => undefined}
          />
          <Tool
            icon="gear"
            name="Tileset settings"
            onClick={() => setTilesetSettingsIsOpen(true)}
          />
        </ToolSection>
      </Tools>
      <div className="overflow-auto h-full flex-1 border-gray-300">
        {currentTileset && (
          <div className="h-full">
            <div key={currentTileset.id} className="relative h-full">
              <img
                ref={(el) => setImageRef(el)}
                className="max-w-none"
                src={currentTileset.blob}
                alt="tileset"
                id="tileset"
                useMap={`#tileset-map`}
              />
              <div
                ref={(el) => setCursorRef(el)}
                className="absolute bg-blue-600 z-40 w-8 h-8 pointer-events-none opacity-50"
              >
                <map name="tileset-map">
                  <area
                    onClick={handleAreaClick}
                    shape="rect"
                    href="#"
                    alt="tile"
                    data-tileset-name={currentTileset.name}
                  />
                </map>
              </div>
            </div>
          </div>
        )}
      </div>
      <TilesetSettingsModal
        isOpen={tilesetSettingsIsOpen}
        onSubmit={async (values) => {
          const tilesetId = currentTileset?.id ?? ''

          await changeTilesetName(currentTileset?.id ?? '', values.name)
          await refreshTilesets()
          setSelectedTilesetId(tilesetId)
        }}
        tilesetName={currentTileset?.name ?? ''}
        onClose={() => setTilesetSettingsIsOpen(false)}
      />
    </div>
  )
}

const TilesetViewMemoized = React.memo(TilesetViewBase)

export function TilesetView() {
  const [
    { selectedLayerId, selectedFileId, files },
    { updateCanvas: updateToolCanvas },
  ] = useContext(EditorContext)

  const file = files.find((file) => file.id === selectedFileId)
  const layer = file?.layers.find((layer) => layer.id === selectedLayerId)

  return (
    <TilesetViewMemoized
      updateToolCanvas={updateToolCanvas}
      layerType={layer?.type ?? 'tilelayer'}
    />
  )
}
