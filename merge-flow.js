{
	docBase: "/merge",
	libraries: ["js/im.js"],
	formLists: {
		main: [
			{id: "initialisation", url: "initialisation.html",
				actions: [
					{
						name: "next",
						submission: {
								url: "{{$end-point-jobs-xml}}/{{//merge/jobId}}",
								method: "get",
								resultInsertPoint: "/merge/jobDetails"
						}
					}
				]
			},
			{id: "jobValidity", url: "check-job-validity.html", docBase:"/merge/jobDetails/job", 
				actions: [
					"stop:invalidJob", 
					{
						name: "next",
						target: "interactiveMerge",
						submissions: [
							{
								url: "{{$end-point-jobs}}/{{//merge/jobId}}/payload",
								method: "get",
								resultInsertPoint: "/merge/payload",
								postTransform: "xslt/removeNamespaces.xsl"
							},
							{
								url: "{{$end-point-templates}}/{{//mmJob//template/fileName}}/fieldsXML",
								method: "get",
								resultInsertPoint: "/merge/ifl"
							},
							{
								url: "http://localhost:8080/portal-wizard-rework/echo",
								method: "post",
								data: {
									echoData: "[dataDocument]",
									paramToEcho: "echoData"
								},
								postTransform: "xslt/formatJobData.xsl",
								resultInsertPoint: "/"
							}
						]
					}
					
				]
			},
			{id: "invalidJob", url: "invalid-job.html"},
			{id: "interactiveMerge", url: "merge-fields.html", docBase: "/merge/interactive", 
				actions:[
					{
						name: "next",
						target: "interactiveMerge"
					}
				]
			}
		]
	}
}