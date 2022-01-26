import alt from 'alt-client';

export function getBranchColor()
{
    switch(alt.branch)
    {
        case "release":
            return "#008736";
        case "rc":
            return "#E26E2D";
        case "dev":
            return "#0367B0";
        case "internal":
            return "#772FEC";
    }
}