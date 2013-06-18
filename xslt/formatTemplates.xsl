<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="UTF-8" />
	
	<xsl:template match="/">
		<xsl:variable name="mainTemplate" select="/merge/payload//template/fileName"/>
		<merge xmlns="">
			<xsl:copy-of select="//jobId | //jobDetails | //payload"/>
			<ifl>
				<fields>
					<xsl:apply-templates select="/merge/templates/ifl/fields[@template=$mainTemplate]/*"/>
				</fields>
			</ifl>
		</merge>
	</xsl:template>
	
	<xsl:template match="field">
		<templateField>
			<xsl:copy-of select="name|type|mandatory|query"/>
			<xsl:apply-templates select="fields"/>
		</templateField>
	</xsl:template>
	
	<xsl:template match="repeat">
		<repeat>
			<xsl:copy-of select="@*"/>
			<xsl:apply-templates select="*"/>
		</repeat>
	</xsl:template>
	
	<xsl:template match="fields">
		<include>
			<xsl:attribute name="file" select="@template"/>
			<xsl:apply-templates select="*"/>
		</include>
	</xsl:template>
</xsl:stylesheet>