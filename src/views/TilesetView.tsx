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

export function TilesetView() {
  const [tilesets, setTilesets] = useState<TilesetType[]>([])
  const [imageIsLoaded, setImageIsLoaded] = useState(false)
  const [cursorRef, setCursorRef] = useState<HTMLDivElement | null>(null)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const [, { updateCanvas: updateToolCanvas }] = useContext(EditorContext)
  const [selectedTileset, setSelectedTileset] = useState<string | null>(null)

  async function refreshTilesets() {
    const tilesets = await getTilesets()
    setTilesets(tilesets)
    setSelectedTileset(tilesets[0]?.id ?? null)
  }

  useEffect(() => {
    refreshTilesets()
  }, [])

  function handleAreaHover(e: React.MouseEvent<HTMLAreaElement, MouseEvent>) {
    if (!(e.target instanceof HTMLAreaElement) || !cursorRef) return

    const coords = e.target.coords
    const [x, y] = coords.split(',').map((n) => parseInt(n))

    cursorRef.style.top = `${y}px`
    cursorRef.style.left = `${x}px`
  }

  async function handleAreaClick(
    e: React.MouseEvent<HTMLAreaElement, MouseEvent>
  ) {
    e.preventDefault()

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

  const imageWidth = imageIsLoaded && imageRef ? imageRef.width : 0
  const imageHeight = imageIsLoaded && imageRef ? imageRef.height : 0

  const rows = new Array(imageHeight / 32).fill(0)
  const columns = new Array(imageWidth / 32).fill(0)

  const grid = rows.map(() => columns.map(() => 0))

  const map =
    imageWidth && imageHeight ? (
      <map name={`testmap`}>
        {grid.map((row, i) => {
          return row.map((tile, j) => {
            return (
              <area
                key={`${i}-${j}`}
                onClick={handleAreaClick}
                onMouseOver={handleAreaHover}
                shape="rect"
                coords={`${j * 32},${i * 32},${j * 32 + 32},${i * 32 + 32}`}
                href="#"
                alt="tile"
                // TODO fix this
                data-tileset-name={tilesets[0].name}
              />
            )
          })
        })}
      </map>
    ) : null

  return (
    <div className="h-0 flex flex-col flex-1 border-gray-600 divide-y">
      <div className="divide-y">
        <Tools>
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
            <Tool icon="gear" name="Rename tileset" onClick={() => undefined} />
          </ToolSection>
        </Tools>
        <div className="p-2 border-gray-300">
          <SelectField
            options={tilesets.map((tileset) => ({
              value: tileset.id,
              label: tileset.name,
            }))}
            onChange={(value) => {
              setSelectedTileset(value)
            }}
            value={selectedTileset ?? ''}
          />
        </div>
      </div>
      <div className="overflow-auto h-full flex-1 border-gray-300">
        {tilesets.map((tileset, i) => (
          <div key={`${tileset.name}-${i}`} className="h-full">
            <div key={tileset.id} className="relative h-full">
              <img
                ref={(el) => setImageRef(el)}
                className="max-w-none"
                src={tileset.blob}
                alt="tileset"
                useMap={`#testmap`}
                onLoad={() => {
                  setImageIsLoaded(true)
                }}
              />
              <div
                ref={(el) => setCursorRef(el)}
                className="absolute bg-blue-600 z-40 w-8 h-8 pointer-events-none opacity-50"
              />
              {map}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}