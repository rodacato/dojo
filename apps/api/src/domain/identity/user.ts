import { UserId } from '../shared/types'

export interface UserProps {
  id: UserId
  githubId: string
  username: string
  avatarUrl: string
  createdAt: Date
}

export class User {
  readonly id: UserId
  readonly githubId: string
  readonly username: string
  readonly avatarUrl: string
  readonly createdAt: Date

  constructor(props: UserProps) {
    this.id = props.id
    this.githubId = props.githubId
    this.username = props.username
    this.avatarUrl = props.avatarUrl
    this.createdAt = props.createdAt
  }

  static create(params: { githubId: string; username: string; avatarUrl: string }): User {
    return new User({
      id: UserId(crypto.randomUUID()),
      githubId: params.githubId,
      username: params.username,
      avatarUrl: params.avatarUrl,
      createdAt: new Date(),
    })
  }
}
