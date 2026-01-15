import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

export const CurrentUser = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    const context = gqlCtx.getContext();

    // Try to get user from different possible locations
    // 1. context.req.user (Express/standard)
    if (context.req?.user) {
      return context.req.user;
    }

    // 2. context.user (Fastify raw request)
    if (context.user) {
      return context.user;
    }

    // 3. context.request?.user (Fastify request object)
    if (context.request?.user) {
      return context.request.user;
    }

    // 4. context.reply?.request?.user (Fastify reply with request)
    if (context.reply?.request?.user) {
      return context.reply.request.user;
    }

    console.warn('CurrentUser decorator: User not found in context', {
      hasReq: !!context.req,
      hasUser: !!context.user,
      hasRequest: !!context.request,
      hasReply: !!context.reply,
    });

    return null;
  },
);