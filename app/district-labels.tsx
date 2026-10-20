import {memo,useMemo} from 'react';
import type {RoadCell} from '../lib/roads';
import {Building} from '../lib/town';
import {MAP} from '../lib/terrain';
import {layoutDistrictLabels} from '../lib/district-labels';
export const DistrictLabels=memo(function DistrictLabels({buildings,size,roadCuts}:{buildings:Building[];size:number;roadCuts?:RoadCell[]}){const labels=useMemo(()=>layoutDistrictLabels(buildings,size,roadCuts),[buildings,size,roadCuts]);return <g className="district-labels" pointerEvents="none" aria-label="Quartieri della città">{labels.map(label=><g key={label.name} transform={`translate(${label.x} ${label.y})`}><rect width={label.width} height={label.height} rx="12" fill="#fff" stroke={MAP.line} strokeWidth=".8"/><text x={label.width/2} y="16" textAnchor="middle" fontFamily="Inter,ui-sans-serif,system-ui,sans-serif" fontSize="10.5" fontWeight="650" letterSpacing="1.1" fill={MAP.ink}>{label.name}</text></g>)}</g>});
