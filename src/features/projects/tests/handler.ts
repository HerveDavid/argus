import { rest } from 'msw'
import { Project } from '../types/project'

export const handlers = [
  rest.get('/api/projects', (req, res, ctx) => {
    return res(ctx.json({
      data: [
        {
          name: "embedded-powsybl",
          path: "~/Projects/TwinEu/Argus/embedded-powsybl",
          color: "bg-orange-500",
        }
      ]
    }))
  })
]