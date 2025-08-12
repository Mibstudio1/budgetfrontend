import { NextResponse } from "next/server";

export const renderCatchError = (error: any) => {
  return NextResponse.json(
    {
      success: false,
      message: error,
      result: [],
    },
    {
      status: 500,
    }
  );
};

export const renderMethodError = (method: any, methodCheck: string) => {
  if (method !== methodCheck)
    return NextResponse.json(
      {
        success: false,
        message: "Error method is not allowed",
        result: [],
      },
      { status: 405 }
    );
};
